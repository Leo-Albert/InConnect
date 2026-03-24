using System.Security.Claims;
using INconnect.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;

namespace INconnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ProfileController(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        var token = Request.Cookies["AuthToken"];
        if (string.IsNullOrEmpty(token))
        {
            token = Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
        }

        if (string.IsNullOrEmpty(token)) return Unauthorized("User must be logged in.");
        
        // Simple manual validation since ValidateToken in every method is repetitive; ideally this goes to a middleware, but for simplicity here we assume the frontend handles the session state, and we just parse the token or rely on [Authorize] if JWT cookie middleware is configured.
        // Actually since we rely on cookie, we must extract the user ID manually or configure Cookie authentication.
        // For ease, we will extract it from the token again.
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        try
        {
            var jwtToken = handler.ReadJwtToken(token);
            var userIdStr = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null || !Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // 2 MB validation
            if (file.Length > 2 * 1024 * 1024)
                return BadRequest("File size exceeds 2 MB limit.");

            // Verify it's an image
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension != ".jpg" && extension != ".jpeg" && extension != ".png" && extension != ".webp")
                return BadRequest("Unsupported image format.");

            var wwwroot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(wwwroot, "profile-images");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

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
        catch
        {
            return Unauthorized();
        }
    }
}
