using INconnect.Application.DTOs;
using INconnect.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace INconnect.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var categories = await _categoryService.GetAllAsync();
            return Ok(categories);
        }

        [HttpPost]
        public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Category name cannot be empty.");

            var category = await _categoryService.CreateAsync(name);
            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Category name cannot be empty.");

            var updated = await _categoryService.UpdateAsync(id, name);
            if (updated == null) return NotFound();

            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var success = await _categoryService.DeleteAsync(id);
            if (!success)
            {
                // Either not found or has topics. Service returns false for both.
                // We could be more specific, but for now this is the safety check.
                return BadRequest("Cannot delete category. It might not exist or it still contains topics.");
            }

            return NoContent();
        }
    }
}
