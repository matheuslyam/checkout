# Documentação de Taxas e Lógica Financeira

Este documento detalha a estrutura de taxas, juros e a lógica de cálculo reverso utilizada no checkout para garantir o recebimento do valor líquido desejado (`Target Net`).

## 1. Visão Geral (Lógica Reversa)

O sistema utiliza uma lógica de **Cálculo Reverso** (`Reverse Calculation`).
O objetivo é calcular o **Valor Total** que deve ser cobrado do cliente para que, após a dedução de todas as taxas do gateway (Asaas), o **Valor Líquido** recebido seja exatamente igual ao preço do produto (+ frete).

### A Fórmula
A fórmula fundamental utilizada é:

$$
\text{Total} = \frac{\text{Alvo Líquido} + \text{Taxa Fixa}}{1 - (\text{Taxa Intermediação} + \text{Taxa Antecipação})}
$$

Onde:
- **Alvo Líquido e Frete**: Preço do Produto + Frete.
- **Taxa Fixa**: Custo fixo por transação (R$ 0,49).
- **Taxa Intermediação**: Porcentagem cobrada pelo gateway pelo processamento.
- **Taxa Antecipação**: Custo financeiro para antecipar o valor das parcelas (recebimento imediato/D+1).

---

## 2. Parâmetros de Configuração

| Parâmetro | Valor | Descrição |
| :--- | :--- | :--- |
| **Parcelamento Máx.** | 21x | Número máximo de parcelas permitidas. |
| **Taxa Fixa** | R$ 0,49 | Cobrado em todas as transações de crédito. |

---

## 3. Taxas por Método de Pagamento

### 3.1. Cartão de Crédito (Parcelado)

O custo do parcelamento é composto por duas taxas que se somam: **Intermediação** (variável por faixa de parcelas) e **Antecipação** (juros mensais aplicados à transação).

#### A. Taxa de Intermediação (Gateway)
Define a tarifa base cobrada pelo Asaas dependendo do número de parcelas.

| Parcelas | Taxa (%) |
| :--- | :--- |
| **1x** | 2.99% |
| **2x a 6x** | 3.49% |
| **7x a 12x** | 3.99% |
| **13x a 21x** | 4.29% |

#### B. Taxa de Antecipação (Financeira)
Custo do dinheiro no tempo. O sistema utiliza uma aproximação linear para calcular o custo total da antecipação baseada em uma taxa mensal.

- **1x (À vista):** 1.15% a.m.
- **2x ou mais:** 1.60% a.m.

**Lógica de Cálculo da Taxa Total de Antecipação:**
O sistema calcula uma taxa média ponderada aproximada para o período total:

```typescript
// Exemplo de código (src/lib/financial.ts)
const taxaMensal = parcelas === 1 ? 1.15 : 1.60;
// Fórmula: TaxaMensal * ((Parcelas + 1) / 2)
const taxaAntecipacaoTotal = (taxaMensal / 100) * ((parcelas + 1) / 2);
```
*(Nota: O termo `(parcelas + 1) / 2` representa uma aproximação do prazo médio de financiamento em meses).*

---

## 4. Exemplos de Simulação

Considerando um produto com Valor Alvo de **R$ 1.000,00**.

### Exemplo 1: Pagamento em 1x (À vista no Crédito)
- **Intermediação:** 2.99% (0.0299)
- **Antecipação:** 1.15% * ((1+1)/2) = 1.15% (0.0115)
- **Taxa Total Combinada:** 0.0299 + 0.0115 = **0.0414 (4.14%)**
- **Cálculo:**
  $$ \text{Total} = \frac{1000 + 0,49}{1 - 0,0414} = \frac{1000,49}{0,9586} \approx \text{R\$ 1.043,70} $$

### Exemplo 2: Pagamento em 10x
- **Intermediação:** 3.99% (Faixa 7-12x)
- **Taxa Mensal Antecipação:** 1.60%
- **Fator Antecipação:** 1.60% * ((10+1)/2) = 1.60% * 5.5 = **8.80%**
- **Taxa Total Combinada:** 3.99% + 8.80% = **12.79%**
- **Cálculo:**
  $$ \text{Total} = \frac{1000 + 0,49}{1 - 0,1279} = \frac{1000,49}{0,8721} \approx \text{R\$ 1.147,22} $$
  *Parcela: R$ 114,72*

---

## 5. Arquivos de Referência no Código

- **Lógica Central:** [`src/lib/financial.ts`](../src/lib/financial.ts)
- **Integração API:** [`src/services/asaas.ts`](../src/services/asaas.ts)
