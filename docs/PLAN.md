# 📋 PLAN.md: Atualização do Catálogo de Bikes (`@project-planner`)

**Objetivo Inicial:** Sincronizar o catálogo de produtos (`src/lib/catalog.ts`) com o novo Catálogo.

---

## 🏗️ Orchestration: Componente de Imagens (Update)

**Objetivo:** Criar tolerância a falhas para mídias não disponíveis (Missing Media Fallback) no checkout e corrigir os assets base das motos que já existiam, de acordo com as novas restrições.

### 🛠️ Proposed Changes

#### [MODIFY] src/lib/catalog.ts (`@backend-specialist`)
1. **Modelos Antigos (Válidos):** G60, V20 PRO, FLASH, Q8, V10 MAX, V8 PRO terão seus paths de `image` revertidos explicitamente para os arquivos `/catalog2/Catalogo Ambtus Serra-_page-00XX.jpg` que já estavam sendo utilizados e validados no front.
2. **Modelos Novos (Sem Mídia):** CITY, FORCE, SUNSHINE, TECH e X12 PLUS terão a propriedade `image` setada como vazia `""` para engatilhar o fallback mode.

#### [MODIFY] src/app/vendedor/page.tsx (`@frontend-specialist`)
- **Renderização Condicional:** Adicionar checagem no preview do link gerado (dentro de `product &&`).
- Se `product.image` estiver vazia ou for nula, em vez de tentar renderizar a `<img>`, o frontend deve exibir uma `div` de placeholder com cor sólida e o texto **"MÍDIA NÃO DISPONÍVEL..."** centralizado na tela preview do Checkout, com estilo condizente ao Dark Mode da aplicação.

### 🧪 Verification Plan (`@test-engineer`)
1. Executar verificação de linting e validação de tipos TypeScript (`npm run build`).
2. Garantir através de análise do componente React que as bikes sem foto não quebram o layout do display de preview.
