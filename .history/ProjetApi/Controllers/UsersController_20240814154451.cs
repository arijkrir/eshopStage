using Microsoft.AspNetCore.Mvc;
using ProjetApi.Models;
using ProjetApi.Services;
using System.Linq;
using System.Threading.Tasks;
using ProjetApi.Data;

namespace ProjetApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ApplicationDbContext _context;

        public UsersController(UserService userService, ApplicationDbContext context)
        {
            _userService = userService;
            _context = context;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            if (user == null)
            {
                return BadRequest("L'utilisateur ne peut pas être nul.");
            }

            try
            {
                var createdUser = await _userService.CreateUserAsync(user);
                return Ok(createdUser);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors de la création de l'utilisateur : {ex.Message}. Détails : {ex.InnerException?.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound("Utilisateur non trouvé.");
            }

            return Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] User user)
        {
            if (user == null || id != user.Id)
            {
                return BadRequest("Les données de l'utilisateur sont invalides.");
            }

            try
            {
                var updatedUser = await _userService.UpdateUserAsync(id, user);
                if (updatedUser == null)
                {
                    return NotFound("Utilisateur non trouvé.");
                }

                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors de la mise à jour de l'utilisateur : {ex.Message}. Détails : {ex.InnerException?.Message}");
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            if (loginRequest == null)
            {
                return BadRequest("Les informations d'identification ne peuvent pas être nulles.");
            }

            var user = await _userService.AuthenticateUserAsync(loginRequest.EmailOrPhone, loginRequest.Password);

            if (user == null)
            {
                return Unauthorized("L'email/téléphone ou le mot de passe est incorrect.");
            }

            return Ok(new { token = "fake-jwt-token", user });
        }

        [HttpGet("top-city")]
        public ActionResult GetTopCities()
        {
            var topCities = _context.Commandes
                .Join(_context.Users,
                      commande => commande.UserId,
                      user => user.Id,
                      (commande, user) => new { user.Ville, commande.CommandeId })
                .GroupBy(x => x.Ville)
                .OrderByDescending(g => g.Count())
                .Select(g => new
                {
                    Ville = g.Key,
                    Commandes = g.Count()
                })
                .Take(10)
                .ToList();

            if (topCities == null || !topCities.Any())
            {
                return NotFound("Aucune ville trouvée.");
            }

            return Ok(topCities);
        }

        [HttpGet("top-users")]
        public ActionResult GetTopUsers()
        {
            var topUsers = _context.Commandes
                .GroupBy(c => c.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    CommandesCount = g.Count()
                })
                .OrderByDescending(x => x.CommandesCount)
                .Take(5)
                .Join(_context.Users,
                      topUser => topUser.UserId,
                      user => user.Id,
                      (topUser, user) => new
                      {
                          user.Nom,
                          user.Prenom,
                          CommandesCount = topUser.CommandesCount
                      })
                .ToList();

            if (topUsers == null || !topUsers.Any())
            {
                return NotFound("Aucun utilisateur trouvé.");
            }

            return Ok(topUsers);
        }
    }

    public class LoginRequest
    {
        public string EmailOrPhone { get; set; }
        public string Password { get; set; }
    }
}
