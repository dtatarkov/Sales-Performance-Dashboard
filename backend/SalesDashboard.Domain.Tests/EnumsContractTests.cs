using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Числовые значения enum'ов — часть контракта api.md (§ «Enum'ы»):
/// фронтенд сопоставляет каждому числу фиксированную подпись и цвет. Значения
/// заданы в enum'ах явно, чтобы перестановка элементов не меняла формат молча,
/// и закреплены здесь, чтобы переименование или перенумерация ломали сборку
/// (backend.md §9).
/// </summary>
public class EnumsContractTests
{
    // api.md: Segment 1=Enterprise, 2=Mid-market, 3=SMB.
    [Theory]
    [InlineData(CustomerSegment.Enterprise, 1)]
    [InlineData(CustomerSegment.MidMarket, 2)]
    [InlineData(CustomerSegment.Smb, 3)]
    public void CustomerSegment_MatchesApiContract(CustomerSegment segment, int wire)
        => Assert.Equal(wire, (int)segment);

    // api.md: SaleStatus 1=paid, 2=refunded, 3=cancelled.
    [Theory]
    [InlineData(SaleStatus.Paid, 1)]
    [InlineData(SaleStatus.Refunded, 2)]
    [InlineData(SaleStatus.Cancelled, 3)]
    public void SaleStatus_MatchesApiContract(SaleStatus status, int wire)
        => Assert.Equal(wire, (int)status);

    // api.md: ContributionUnit 1=gp, 2=revenue, 3=units, 4=ac.
    [Theory]
    [InlineData(ContributionBasis.GrossProfit, 1)]
    [InlineData(ContributionBasis.Revenue, 2)]
    [InlineData(ContributionBasis.Units, 3)]
    [InlineData(ContributionBasis.AverageCheck, 4)]
    public void ContributionBasis_MatchesApiContract(ContributionBasis basis, int wire)
        => Assert.Equal(wire, (int)basis);

    // api.md: DeltaUnit 1=percent, 2=pp.
    [Theory]
    [InlineData(DeltaUnit.Percent, 1)]
    [InlineData(DeltaUnit.Pp, 2)]
    public void DeltaUnit_MatchesApiContract(DeltaUnit unit, int wire)
        => Assert.Equal(wire, (int)unit);

    /// <summary>
    /// Ни один элемент enum'а не может стоять на 0: контракт провода начинается
    /// с 1, поэтому 0 свободен под смысл «значение отсутствует», и случайное
    /// значение по умолчанию не может выглядеть как настоящее.
    /// </summary>
    [Theory]
    [InlineData(typeof(SaleStatus))]
    [InlineData(typeof(CustomerSegment))]
    [InlineData(typeof(ContributionBasis))]
    [InlineData(typeof(DeltaUnit))]
    public void WireEnum_NeverDefinesZero(Type enumType)
        => Assert.DoesNotContain(0, Enum.GetValues(enumType).Cast<int>());
}

