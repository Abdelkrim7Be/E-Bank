package com.bellagnech.reporting.services;
import com.bellagnech.reporting.clients.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
class ReportingServiceTest {
    @Test void analysisUsesOneAggregateRequestAndNoAccountHistoryCalls() {
        var customers = mock(CustomerServiceClient.class);
        var accounts = mock(AccountServiceClient.class);
        var transactions = mock(TransactionServiceClient.class);
        var row = new TransactionServiceClient.TypeSummary();
        row.type = "CREDIT"; row.total = 2; row.volume = 150;
        when(transactions.getTypeSummary(30)).thenReturn(List.of(row));
        var service = new ReportingService(customers, accounts, transactions);
        var report = service.getTransactionAnalysisReport(30);
        assertThat((Map<?,?>)report.get("summary")).isEqualTo(Map.of("totalTransactions",2L,"totalVolume",150d,"averageAmount",75d));
        verify(transactions).getTypeSummary(30);
        verifyNoMoreInteractions(transactions);
        verifyNoInteractions(customers, accounts);
        assertThatThrownBy(() -> service.getTransactionAnalysisReport(-1)).isInstanceOf(IllegalArgumentException.class);
    }
}
