using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using INconnect.Infrastructure.Data;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace INconnect.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public ProfileController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var contributionCount = await _context.Topics
            .CountAsync(t => t.Createdby == id && (t.Isdeleted == false || t.Isdeleted == null));

        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            profileImage = user.Profileimage,
            contributionCount = contributionCount
        });
    }

    [AllowAnonymous]
    [HttpGet("{id}/export")]
    public async Task<IActionResult> ExportTopics(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var topics = await _context.Topics
            .Where(t => t.Createdby == id && (t.Isdeleted == false || t.Isdeleted == null))
            .OrderBy(t => t.Createdat)
            .ToListAsync();

        using (var stream = new MemoryStream())
        {
            using (var wordDocument = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
            {
                var mainPart = wordDocument.AddMainDocumentPart();
                mainPart.Document = new Document();
                var body = mainPart.Document.AppendChild(new Body());

                // Add Title Header
                var titlePara = body.AppendChild(new Paragraph());
                var titleRun = titlePara.AppendChild(new Run());
                var titleProps = new RunProperties();
                titleProps.AppendChild(new Bold());
                titleProps.AppendChild(new FontSize { Val = "40" }); // ~20pt
                titleRun.AppendChild(titleProps);
                titleRun.AppendChild(new Text($"{user.Name}'s Contributions"));
                
                body.AppendChild(new Paragraph()); // Spacer

                int chunkId = 1;
                foreach (var topic in topics)
                {
                    // Topic Title (Bold)
                    var pTopicTitle = body.AppendChild(new Paragraph());
                    var rTopicTitle = pTopicTitle.AppendChild(new Run());
                    var rpTopicTitle = new RunProperties();
                    rpTopicTitle.AppendChild(new Bold());
                    rpTopicTitle.AppendChild(new FontSize { Val = "28" }); // ~14pt
                    rTopicTitle.AppendChild(rpTopicTitle);
                    rTopicTitle.AppendChild(new Text(topic.Title));

                    // Use altChunk to embed HTML content and preserve rich-text formatting
                    string altChunkId = $"altChunkId{chunkId++}";
                    var afip = mainPart.AddAlternativeFormatImportPart(AlternativeFormatImportPartType.Html, altChunkId);
                    
                    // Wrapping in basic HTML/Body ensures the parser handles it correctly
                    string htmlContent = $"<html><body>{topic.Content ?? ""}</body></html>";
                    using (var ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(htmlContent)))
                    {
                        afip.FeedData(ms);
                    }

                    var altChunk = new AltChunk { Id = altChunkId };
                    body.AppendChild(altChunk);
                    
                    body.AppendChild(new Paragraph()); // Spacer after the chunk
                }

                mainPart.Document.Save();
            }

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", $"{user.Name.Replace(" ", "_")}_Contributions.docx");
        }
    }
    
    [AllowAnonymous]
    [HttpGet("{id}/export-pdf")]
    public async Task<IActionResult> ExportTopicsPdf(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var topics = await _context.Topics
            .Where(t => t.Createdby == id && (t.Isdeleted == false || t.Isdeleted == null))
            .OrderBy(t => t.Createdat)
            .ToListAsync();

        try 
        {
            // Browser setup
            var browserFetcher = new BrowserFetcher();
            await browserFetcher.DownloadAsync();
            await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions { Headless = true });
            await using var page = await browser.NewPageAsync();

            // Construct HTML with some premium styling
            var htmlBuilder = new System.Text.StringBuilder();
            htmlBuilder.Append($@"
                <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
                        body {{ font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #fff; }}
                        .header {{ text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 24px; margin-bottom: 40px; }}
                        .header h1 {{ color: #1e1b4b; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }}
                        .header p {{ color: #64748b; margin: 8px 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }}
                        .topic {{ margin-bottom: 40px; page-break-inside: avoid; }}
                        .topic-title {{ color: #4f46e5; font-size: 22px; font-weight: 700; margin-bottom: 12px; border-left: 5px solid #6366f1; padding-left: 20px; }}
                        .topic-content {{ font-size: 15px; color: #334155; margin-left: 25px; }}
                        .topic-date {{ font-size: 12px; color: #94a3b8; margin-top: 10px; margin-left: 25px; font-weight: 500; font-style: italic; }}
                        footer {{ position: fixed; bottom: 20px; width: 100%; text-align: center; color: #94a3b8; font-size: 10px; }}
                        @page {{ size: A4; margin: 25mm; }}
                    </style>
                </head>
                <body>
                    <div class='header'>
                        <h1>{user.Name}'s Contributions</h1>
                        <p>Generated via INconnect Platform</p>
                    </div>");

            foreach (var topic in topics)
            {
                htmlBuilder.Append($@"
                    <div class='topic'>
                        <div class='topic-title'>{topic.Title}</div>
                        <div class='topic-content'>{topic.Content}</div>
                        <div class='topic-date'>Published on {topic.Createdat:MMMM dd, yyyy}</div>
                    </div>");
            }

            htmlBuilder.Append($@"
                    <footer>Professional Portfolio for {user.Name} | &copy; {DateTime.Now.Year} INconnect</footer>
                </body></html>");

            await page.SetContentAsync(htmlBuilder.ToString());
            var pdfBuffer = await page.PdfDataAsync(new PdfOptions
            {
                Format = PaperFormat.A4,
                PrintBackground = true,
                MarginOptions = new MarginOptions { Top = "25mm", Right = "25mm", Bottom = "25mm", Left = "25mm" }
            });

            return File(pdfBuffer, "application/pdf", $"{user.Name.Replace(" ", "_")}_Contributions.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to generate PDF.", details = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<IActionResult> SearchProfiles([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(new List<object>());

        var query = q.ToLower();
        var users = await _context.Users
            .Where(u => u.Name.ToLower().Contains(query))
            .Take(10)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Profileimage
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
        if (file.Length > 2 * 1024 * 1024) return BadRequest("File size exceeds 2 MB limit.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".webp")
            return BadRequest("Unsupported image format.");

        var wwwroot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(wwwroot, "profile-images");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        user.Profileimage = uniqueFileName;
        await _context.SaveChangesAsync();

        return Ok(new { profileImage = uniqueFileName });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        // Verify current password
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Passwordhash))
        {
            return BadRequest(new { message = "Incorrect current password." });
        }

        user.Passwordhash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPost("update-email")]
    public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailDto dto)
    {
        var user = await _context.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        if (await _context.Users.AnyAsync(u => u.Email == dto.NewEmail && u.Id != user.Id))
        {
            return BadRequest(new { message = "Email is already in use by another account." });
        }

        user.Email = dto.NewEmail;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Email updated successfully.", newEmail = user.Email });
    }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateEmailDto
{
    public string NewEmail { get; set; } = string.Empty;
}
