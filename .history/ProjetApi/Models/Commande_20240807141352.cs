namespace ProjetApi.Models
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Commande
    {
        [Key]
        public int CommandeId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public decimal PrixTotal { get; set; }

        public ICollection<Article> Articles { get; set; }
    }

public class Article
    {
        [Key]
        public int ArticleId { get; set; }

        [Required]
        public int ProduitId { get; set; }

        [ForeignKey("ProduitId")]
        public Produit Produit { get; set; }

        [Required]
        public int Quantite { get; set; }

        [Required]
        public int CommandeId { get; set; }

        [ForeignKey("CommandeId")]
        public Commande Commande { get; set; }
    }
