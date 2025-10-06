# SIBS Payment Library

Esta biblioteca implementa a integração com o SIBS Payment Gateway para processamento de pagamentos em Portugal, suportando Multibanco, MB WAY e cartões de crédito.

## 📋 Funcionalidades

- ✅ **Criação de transações** - Server-to-Server checkout
- ✅ **Verificação de status** - Consulta do estado das transações
- ✅ **Geração de referências Multibanco** - Criação de referências para pagamento
- ✅ **Validação de webhooks** - Processamento seguro de notificações
- ✅ **Configuração tipo-segura** - Validação automática de configurações
- ✅ **Tratamento de erros** - Exceções customizadas para diferentes cenários

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis ao seu `.env`:

```env
# SIBS Gateway Configuration
SIBS_BASE_URL=https://spg.qly.site1.sibs.pt/api/v2  # URL da API (sandbox/produção)
SIBS_TOKEN=your_bearer_token_here                    # Token de autenticação
SIBS_CLIENT_ID=your_client_id_here                   # Client ID da aplicação
SIBS_TERMINAL_ID=your_terminal_id_here               # ID do terminal
SIBS_ENTITY=your_entity_here                         # Entidade para referências Multibanco
SIBS_WEBHOOK_SECRET=your_webhook_secret_here         # Secret para validação de webhooks
```

### Importação do Módulo

```typescript
import { Module } from '@nestjs/common';
import { SibsModule } from '@lib/sibs';

@Module({
  imports: [SibsModule],
  // ...
})
export class AppModule {}
```

## 🚀 Uso Básico

### Injeção do Serviço

```typescript
import { Injectable } from '@nestjs/common';
import { SibsService } from '@lib/sibs';

@Injectable()
export class PaymentService {
  constructor(private readonly sibsService: SibsService) {}
}
```

### Criação de Transação

```typescript
import {
  CreateTransactionDto,
  PaymentMethodEnum,
  ChannelEnum
} from '@lib/sibs';

async createPayment() {
  const transactionData: CreateTransactionDto = {
    description: 'Pagamento da encomenda #12345',
    amount: {
      value: 25.50,
      currency: 'EUR'
    },
    paymentMethod: [PaymentMethodEnum.REFERENCE, PaymentMethodEnum.MBWAY],
    channel: ChannelEnum.WEB,
    merchantTransactionId: `order-${Date.now()}`,
    customerInfo: {
      customerEmail: 'cliente@example.com',
      shippingAddress: {
        street1: 'Rua da Liberdade, 123',
        city: 'Lisboa',
        postcode: '1200-100',
        country: 'PT'
      },
      billingAddress: {
        street1: 'Rua da Liberdade, 123',
        city: 'Lisboa',
        postcode: '1200-100',
        country: 'PT'
      }
    },
    paymentReference: {
      initialDatetime: new Date().toISOString(),
      finalDatetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxAmount: { value: 25.50, currency: 'EUR' },
      minAmount: { value: 25.50, currency: 'EUR' },
      entity: '24000'
    }
  };

  try {
    const checkout = await this.sibsService.createCheckout(transactionData);

    return {
      transactionId: checkout.transactionID,
      transactionSignature: checkout.transactionSignature,
      paymentMethods: checkout.paymentMethodList,
      expiry: checkout.expiry
    };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    throw error;
  }
}
```

### Verificação de Status

```typescript
async checkPaymentStatus(transactionId: string, transactionSignature?: string) {
  try {
    const status = await this.sibsService.getTransactionStatus(
      transactionId,
      transactionSignature
    );

    console.log('Status do pagamento:', status.paymentStatus);

    if (status.paymentReference) {
      console.log('Referência Multibanco:', {
        entity: status.paymentReference.entity,
        reference: status.paymentReference.reference,
        amount: status.paymentReference.amount
      });
    }

    return status;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
}
```

### Geração de Referência Multibanco

```typescript
async generateMultibancoReference(
  transactionId: string,
  transactionSignature: string
) {
  try {
    const result = await this.sibsService.generateMultibancoReference(
      transactionId,
      transactionSignature
    );

    if (result.paymentReference) {
      return {
        entity: result.paymentReference.entity,
        reference: result.paymentReference.reference,
        amount: result.paymentReference.amount.value
      };
    }

    throw new Error('Referência Multibanco não foi gerada');
  } catch (error) {
    console.error('Erro ao gerar referência:', error);
    throw error;
  }
}
```

### Processamento de Webhooks

```typescript
import { Controller, Post, Body, Headers } from '@nestjs/common';
import { SibsService } from '@lib/sibs';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly sibsService: SibsService) {}

  @Post('sibs')
  async handleSibsWebhook(
    @Body() rawPayload: string,
    @Headers('x-sibs-signature') signature: string,
  ) {
    try {
      const webhookData = this.sibsService.processWebhook(
        JSON.stringify(rawPayload),
        signature,
      );

      console.log('Webhook processado:', {
        transactionId: webhookData.transactionId,
        merchantTransactionId: webhookData.merchantTransactionId,
        paymentStatus: webhookData.paymentStatus,
        paymentMethod: webhookData.paymentMethod,
      });

      // Processar o resultado do pagamento
      await this.handlePaymentUpdate(webhookData);

      return { success: true };
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  private async handlePaymentUpdate(webhookData: any) {
    // Implementar lógica de negócio para atualizar o status do pagamento
    // Por exemplo, atualizar base de dados, enviar emails, etc.
  }
}
```

## 📊 Estados de Pagamento

Os possíveis estados de uma transação são:

- **Processing** - Transação em processamento
- **Success** - Pagamento completado com sucesso
- **Cancelled** - Pagamento cancelado
- **Timeout** - Pagamento expirou
- **Failed** - Pagamento falhado

## 🎯 Métodos de Pagamento

### Multibanco (REFERENCE)

```typescript
paymentMethod: [PaymentMethodEnum.REFERENCE];
```

### MB WAY

```typescript
paymentMethod: [PaymentMethodEnum.MBWAY];
```

### Cartão de Crédito (CARD)

```typescript
paymentMethod: [PaymentMethodEnum.CARD];
// Requer customerInfo obrigatório para conformidade PCI-DSS
```

### Múltiplos Métodos

```typescript
paymentMethod: [
  PaymentMethodEnum.REFERENCE,
  PaymentMethodEnum.MBWAY,
  PaymentMethodEnum.CARD,
];
```

## 🔒 Segurança

### Validação de Webhooks

A biblioteca valida automaticamente a assinatura dos webhooks usando HMAC-SHA256:

```typescript
// A validação é feita automaticamente no método processWebhook
const webhookData = this.sibsService.processWebhook(payload, signature);
```

### Configurações Seguras

- Use sempre HTTPS em produção
- Mantenha o `SIBS_WEBHOOK_SECRET` seguro
- Rotacione tokens regularmente
- Use variáveis de ambiente para configurações sensíveis

## ⚠️ Tratamento de Erros

A biblioteca define exceções específicas:

```typescript
import {
  SibsException,
  SibsConfigurationException,
  SibsTransactionNotFoundException,
  SibsValidationException,
  SibsApiException,
} from '@lib/sibs';

try {
  // Operações SIBS
} catch (error) {
  if (error instanceof SibsTransactionNotFoundException) {
    // Transação não encontrada
  } else if (error instanceof SibsValidationException) {
    // Erro de validação
  } else if (error instanceof SibsApiException) {
    // Erro da API SIBS
  }
}
```

## 🧪 Ambiente de Teste

### URLs

- **Sandbox**: `https://spg.qly.site1.sibs.pt/api/v2`
- **Produção**: `https://spg.sibs.pt/api/v2`

### Dados de Teste

Consulte a documentação oficial do SIBS para dados de teste válidos.

## 📚 Documentação Oficial

- [SIBS Payment Gateway - Integration Guide](https://www.docs.pay.sibs.com/portugal/sibs-gateway/integrations/api/integration-guide/)
- [SIBS Developer Portal](https://developer.sibs.com/)

## 🤝 Contribuição

Para contribuir com melhorias na biblioteca:

1. Implemente novas funcionalidades seguindo os padrões existentes
2. Adicione testes unitários
3. Atualize a documentação
4. Mantenha compatibilidade com a API do SIBS

## 📄 Licença

Esta biblioteca segue a licença do projeto principal.
