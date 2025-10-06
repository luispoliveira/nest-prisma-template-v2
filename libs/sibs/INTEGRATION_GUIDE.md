# Como usar a biblioteca SIBS na aplicação

## 1. Importar o módulo na aplicação

Adicione o `SibsModule` ao seu módulo principal ou de pagamentos:

```typescript
// apps/api/src/app.module.ts
import { SibsModule } from '@lib/sibs';

@Module({
  imports: [
    // ... outros módulos
    SibsModule,
  ],
  // ...
})
export class AppModule {}
```

## 2. Configurar variáveis de ambiente

Adicione no seu arquivo `.env`:

```bash
# SIBS Configuration
SIBS_BASE_URL=https://spg.qly.site1.sibs.pt/api/v2  # URL do ambiente (sandbox)
SIBS_TOKEN=your_bearer_token_here                    # Token fornecido pelo SIBS
SIBS_CLIENT_ID=your_client_id_here                   # Client ID da aplicação
SIBS_TERMINAL_ID=your_terminal_id_here               # ID do terminal
SIBS_ENTITY=your_entity_here                         # Entidade para Multibanco
SIBS_WEBHOOK_SECRET=your_webhook_secret_here         # Secret para webhooks
```

## 3. Criar um controller de pagamentos

```typescript
// apps/api/src/payments/payments.controller.ts
import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SibsService,
  CreateTransactionDto,
  PaymentMethodEnum,
  ChannelEnum,
} from '@lib/sibs';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly sibsService: SibsService) {}

  @Post('create')
  async createPayment(
    @Body()
    body: {
      amount: number;
      description: string;
      orderId: string;
      customerEmail?: string;
    },
  ) {
    const transactionDto: CreateTransactionDto = {
      description: body.description,
      amount: { value: body.amount, currency: 'EUR' },
      paymentMethod: [PaymentMethodEnum.REFERENCE, PaymentMethodEnum.MBWAY],
      channel: ChannelEnum.WEB,
      merchantTransactionId: body.orderId,
    };

    return await this.sibsService.createCheckout(transactionDto);
  }

  @Get(':transactionId/status')
  async getPaymentStatus(
    @Param('transactionId') transactionId: string,
    @Query('signature') signature?: string,
  ) {
    return await this.sibsService.getTransactionStatus(
      transactionId,
      signature,
    );
  }
}
```

## 4. Criar módulo de pagamentos

```typescript
// apps/api/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { SibsModule } from '@lib/sibs';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [SibsModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
```

## 5. Registrar o módulo no AppModule

```typescript
// apps/api/src/app.module.ts
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // ... outros módulos
    PaymentsModule,
  ],
  // ...
})
export class AppModule {}
```

## 6. Testar os endpoints

### Criar pagamento

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25.50,
    "description": "Pagamento teste",
    "orderId": "order-123",
    "customerEmail": "cliente@example.com"
  }'
```

### Verificar status

```bash
curl -X GET "http://localhost:3000/api/payments/{transactionId}/status"
```

## 7. Exemplo completo de uso

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SibsService, PaymentMethodEnum, ChannelEnum } from '@lib/sibs';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly sibsService: SibsService) {}

  async processPayment(orderId: string, amount: number, customerEmail: string) {
    try {
      // 1. Criar checkout no SIBS
      const checkout = await this.sibsService.createCheckout({
        description: `Pagamento da encomenda ${orderId}`,
        amount: { value: amount, currency: 'EUR' },
        paymentMethod: [PaymentMethodEnum.REFERENCE, PaymentMethodEnum.MBWAY],
        channel: ChannelEnum.WEB,
        merchantTransactionId: orderId,
        customerInfo: {
          customerEmail,
          shippingAddress: {
            street1: 'Rua do Cliente, 123',
            city: 'Lisboa',
            postcode: '1200-100',
            country: 'PT',
          },
          billingAddress: {
            street1: 'Rua do Cliente, 123',
            city: 'Lisboa',
            postcode: '1200-100',
            country: 'PT',
          },
        },
      });

      // 2. Gerar referência Multibanco se necessário
      if (checkout.paymentMethodList.includes('REFERENCE')) {
        const mbRef = await this.sibsService.generateMultibancoReference(
          checkout.transactionID,
          checkout.transactionSignature,
        );

        this.logger.log('Multibanco reference generated', {
          entity: mbRef.paymentReference?.entity,
          reference: mbRef.paymentReference?.reference,
        });
      }

      return {
        transactionId: checkout.transactionID,
        paymentMethods: checkout.paymentMethodList,
        expiry: checkout.expiry,
      };
    } catch (error) {
      this.logger.error('Payment processing failed', { error, orderId });
      throw error;
    }
  }

  async checkPaymentStatus(transactionId: string) {
    try {
      const status = await this.sibsService.getTransactionStatus(transactionId);

      // Atualizar status da encomenda baseado no pagamento
      switch (status.paymentStatus) {
        case 'Success':
          await this.markOrderAsPaid(status.transactionID);
          break;
        case 'Failed':
        case 'Cancelled':
          await this.markOrderAsFailed(status.transactionID);
          break;
        case 'Timeout':
          await this.markOrderAsExpired(status.transactionID);
          break;
      }

      return status;
    } catch (error) {
      this.logger.error('Failed to check payment status', {
        error,
        transactionId,
      });
      throw error;
    }
  }

  private async markOrderAsPaid(transactionId: string) {
    // Implementar lógica para marcar encomenda como paga
    this.logger.log('Order marked as paid', { transactionId });
  }

  private async markOrderAsFailed(transactionId: string) {
    // Implementar lógica para marcar encomenda como falhada
    this.logger.log('Order marked as failed', { transactionId });
  }

  private async markOrderAsExpired(transactionId: string) {
    // Implementar lógica para marcar encomenda como expirada
    this.logger.log('Order marked as expired', { transactionId });
  }
}
```

A biblioteca está agora totalmente implementada e pronta para usar! ✅
