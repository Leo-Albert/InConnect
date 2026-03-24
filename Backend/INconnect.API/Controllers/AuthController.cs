using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using INconnect.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace INconnect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email is already registered." });

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Passwordhash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        SetAuthCookie(token);

        return Ok(new { token = token, user = new { user.Id, user.Name, user.Email, user.Profileimage } });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || user.Passwordhash == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Passwordhash))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = GenerateJwtToken(user);
        SetAuthCookie(token);

        return Ok(new { token = token, user = new { user.Id, user.Name, user.Email, user.Profileimage } });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        // Try to get token from cookie first, then fall back to Authorization header
        var token = Request.Cookies["AuthToken"];
        if (string.IsNullOrEmpty(token))
        {
            token = Request.Headers.Authorization.FirstOrDefault()?.Split(" ").Last();
        }

        if (string.IsNullOrEmpty(token)) return Unauthorized();

        var handler = new JwtSecurityTokenHandler();
        try
        {
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32BytesLong!");
            var parameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
            };

            var principal = handler.ValidateToken(token, parameters, out var validateToken);
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return Unauthorized();

            return Ok(new { user = new { user.Id, user.Name, user.Email, user.Profileimage, user.Bio } });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AUTH] Token validation failed: {ex.Message}");
            return Unauthorized(new { message = "Invalid session", details = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("AuthToken");
        return Ok(new { message = "Logged out" });
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32BytesLong!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetAuthCookie(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(30),
            SameSite = SameSiteMode.None, // Required for cross-site (different port/protocol)
            Secure = true, // Required for SameSite=None
            Path = "/",
            IsEssential = true
        };
        Response.Cookies.Append("AuthToken", token, cookieOptions);
    }
}

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
