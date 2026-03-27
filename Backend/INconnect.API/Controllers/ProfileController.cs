using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using INconnect.Infrastructure.Data;

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
            using (var wordDocument = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Create(stream, DocumentFormat.OpenXml.WordprocessingDocumentType.Document))
            {
                var mainPart = wordDocument.AddMainDocumentPart();
                mainPart.Document = new DocumentFormat.OpenXml.Wordprocessing.Document();
                var body = mainPart.Document.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Body());

                // Add Title Header
                var titlePara = body.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Paragraph());
                var titleRun = titlePara.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Run());
                var titleProps = new DocumentFormat.OpenXml.Wordprocessing.RunProperties();
                titleProps.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Bold());
                titleProps.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.FontSize { Val = "36" }); // 18pt
                titleRun.AppendChild(titleProps);
                titleRun.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Text($"{user.Name}'s Contributions"));
                
                body.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Paragraph()); // Spacer

                foreach (var topic in topics)
                {
                    // Topic Title (Bold)
                    var pTopicTitle = body.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Paragraph());
                    var rTopicTitle = pTopicTitle.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Run());
                    var rpTopicTitle = new DocumentFormat.OpenXml.Wordprocessing.RunProperties();
                    rpTopicTitle.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Bold());
                    rpTopicTitle.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.FontSize { Val = "28" }); // 14pt
                    rTopicTitle.AppendChild(rpTopicTitle);
                    rTopicTitle.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Text(topic.Title));

                    // Strip HTML tags for clean Word content
                    var plainContent = System.Text.RegularExpressions.Regex.Replace(topic.Content ?? "", "<.*?>", string.Empty);
                    var decodedContent = System.Net.WebUtility.HtmlDecode(plainContent);

                    var pContent = body.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Paragraph());
                    var rContent = pContent.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Run());
                    rContent.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Text(decodedContent));
                    
                    body.AppendChild(new DocumentFormat.OpenXml.Wordprocessing.Paragraph()); // Spacer
                }

                mainPart.Document.Save();
            }

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", $"{user.Name.Replace(" ", "_")}_Contributions.docx");
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
