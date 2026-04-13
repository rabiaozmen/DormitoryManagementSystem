using System.Security.Claims;
using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

using DormitoryManagementSystem.Application.Security.Models;

namespace DormitoryManagementSystem.Tests;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _sut;
    private readonly Mock<IOptions<JwtOptions>> _jwtOptionsMock;

    public JwtTokenServiceTests()
    {
        _jwtOptionsMock = new Mock<IOptions<JwtOptions>>();
        _jwtOptionsMock.Setup(x => x.Value).Returns(new JwtOptions
        {
            SecretKey = "super_secret_key_that_is_long_enough_for_hmacsha256",
            Issuer = "test_issuer",
            Audience = "test_audience",
            AccessTokenMinutes = 15
        });

        _sut = new JwtTokenService(_jwtOptionsMock.Object);
    }

    [Fact]
    public void CreateAccessToken_Should_Return_Valid_TokenString()
    {
        // Arrange
        var request = new TokenRequest
        {
            UserId = Guid.NewGuid(),
            Email = "student@test.local",
            Role = "Student"
        };

        // Act
        var token = _sut.CreateAccessToken(request);

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3, "because JWTs consist of 3 parts");
    }
}
