using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Domain.Entities;

public class Society
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [MaxLength(10)]
    public string PinCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string ContactPhone { get; set; } = string.Empty;

    [MaxLength(200)]
    public string ContactEmail { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Building> Buildings { get; set; } = new List<Building>();
    public ICollection<Flat> Flats { get; set; } = new List<Flat>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
