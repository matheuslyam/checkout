export interface Product {
    id: string
    name: string
    price: number // Price in CENTS (e.g. 1264000 = R$ 12.640,00)
    image: string
    description: string
    maxInstallments: number
    isActive?: boolean
}

export const BIKES_CATALOG: Record<string, Product> = {
    // ---- Active Bikes (Maintained and Updated) ----
    'g60': {
        id: 'g60',
        name: 'AMBTUS G60',
        price: 799900,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0003.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Autonomia 60km, Velocidade 32km/h, Pneus 20x4, Sistema de freios, Shimano 7 marchas',
        maxInstallments: 21
    },
    'v20-pro': {
        id: 'v20-pro',
        name: 'AMBTUS V20 PRO',
        price: 849900,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0004.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Autonomia 60km, Velocidade 32km/h, Pneus 20x4, Sistema de freios, Shimano 7 marchas',
        maxInstallments: 21
    },
    'ambtus-flash': {
        id: 'ambtus-flash',
        name: 'AMBTUS FLASH',
        price: 749900,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0005.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V, Autonomia 50km, Velocidade 32km/h, Pneus 20x4 Kenda, Freios Duplo Hidráulico, Shimano 7 marchas, Alarme',
        maxInstallments: 21
    },
    'q8': {
        id: 'q8',
        name: 'AMBTUS Q8',
        price: 849900,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0006.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Autonomia 45km, Velocidade 32km/h, Pneus 20x4 Kenda, Freios Hidráulico zoom, Shimano 7 marchas, Alarme',
        maxInstallments: 21
    },
    'v10-max': {
        id: 'v10-max',
        name: 'AMBTUS V10 MAX',
        price: 850000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0007.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Autonomia 60km, Velocidade 32km/h, Pneus 20x4, Freios à disco dianteiro e traseiro, Suspensão Dupla',
        maxInstallments: 21
    },
    'v8-pro': {
        id: 'v8-pro',
        name: 'AMBTUS V8 PRO',
        price: 850000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0008.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Autonomia 50km, Velocidade 32km/h, Pneus 20x4, Freios Hidráulicos, Shimano 7 marchas, Alarme',
        maxInstallments: 21
    },

    // ---- New Bikes ----
    'ambtus-city': {
        id: 'ambtus-city',
        name: 'AMBTUS CITY',
        price: 1029000,
        image: '',
        description: 'MÍDIA NÃO DISPONÍVEL NO MOMENTO. Potência 1000W, Bateria Lítio FLP, Autonomia 50 a 60km, Velocidade 32km/h, Pneus 3.00-10 Tubeless, Freios Disco hidráulico',
        maxInstallments: 21
    },
    'ambtus-force': {
        id: 'ambtus-force',
        name: 'AMBTUS FORCE',
        price: 1100000,
        image: '',
        description: 'MÍDIA NÃO DISPONÍVEL NO MOMENTO. Potência 1000W, Bateria Lítio FLP, Autonomia 50 a 60km, Velocidade 32km/h, Pneus Tubeless Sem Camara de Ar, Freios à disco, Alarme, App',
        maxInstallments: 21
    },
    'ambtus-sunshine': {
        id: 'ambtus-sunshine',
        name: 'AMBTUS SUNSHINE',
        price: 1299000,
        image: '',
        description: 'MÍDIA NÃO DISPONÍVEL NO MOMENTO. Potência 1000W, Bateria Lítio FLP, Autonomia 50 a 60 km, Velocidade 32km/h, Pneus 90/80-12 tubeless, Freios à Disco hidraúlicos, Alarme, USB',
        maxInstallments: 21
    },
    'ambtus-tech': {
        id: 'ambtus-tech',
        name: 'AMBTUS TECH',
        price: 1199000,
        image: '',
        description: 'MÍDIA NÃO DISPONÍVEL NO MOMENTO. Potência 1000W, Autonomia 50 a 60km, Velocidade 32km/h, Pneus 3.00-10 tubeless, Freios à Disco hidráulico, Alarme e NFC, Porta USB',
        maxInstallments: 21
    },
    'ambtus-x12-plus': {
        id: 'ambtus-x12-plus',
        name: 'AMBTUS X12 PLUS',
        price: 1059000,
        image: '',
        description: 'MÍDIA NÃO DISPONÍVEL NO MOMENTO. Potência 1000W, Autonomia 50 a 60 km, Velocidade 32km/h, Pneus 225/40-10, Freios Hidráulicos, Alarme, Porta USB, Tensão 110V/220V',
        maxInstallments: 21
    },

    // ---- Inactive Bikes (Soft Deletes) ----
    'y16': {
        id: 'y16',
        name: 'AMBTUS Y16',
        price: 699900,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0009.jpg',
        description: 'Potência 1000W, Bateria Lítio, Freio Disco Duplo, Amortecedor Dianteiro/Traseiro, Autonomia 84km',
        maxInstallments: 21,
        isActive: false
    },
    'ae6': {
        id: 'ae6',
        name: 'AMBTUS AE6',
        price: 859000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0010.jpg',
        description: 'Dobrável, Potência 750W, Bateria 48V 15AH, Freios a disco, Shimano 7 marchas',
        maxInstallments: 21,
        isActive: false
    },
    'ae7': {
        id: 'ae7',
        name: 'AMBTUS AE7',
        price: 819000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0011.jpg',
        description: 'Potência 750W, Bateria 48V 15AH, Freios a disco mecânicos, Amortecedor Hidráulico Dianteiro/Mola Traseiro',
        maxInstallments: 21,
        isActive: false
    },
    'c3': {
        id: 'c3',
        name: 'AMBTUS C3',
        price: 689000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0012.jpg',
        description: 'Potência 800W, Bateria 48V 24AH, Autonomia 75km, Freios a disco',
        maxInstallments: 21,
        isActive: false
    },
    'c10': {
        id: 'c10',
        name: 'AMBTUS C10',
        price: 799000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0013.jpg',
        description: 'Potência 1000W, Bateria Chumbo Ácido 5*15V 20AH, Autonomia 65km, Freios Hidráulicos',
        maxInstallments: 21,
        isActive: false
    },
    'c12': {
        id: 'c12',
        name: 'AMBTUS C12',
        price: 929000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0014.jpg',
        description: 'Potência 1000W, Bateria Lítio 60V 20AH, Autonomia 75km, Freios a disco, Banco com encosto',
        maxInstallments: 21,
        isActive: false
    },
    'c15': {
        id: 'c15',
        name: 'AMBTUS C15',
        price: 1029000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0015.jpg',
        description: 'Potência 1000W, Bateria Lítio 60V 20AH, Autonomia 65km, Amortecedor Hidráulico, Freios a disco',
        maxInstallments: 21,
        isActive: false
    },
    't3': {
        id: 't3',
        name: 'AMBTUS T3',
        price: 1159000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0016.jpg',
        description: 'Triciclo, Potência 1500W, Bateria Lítio 60V 20AH, Autonomia 65km, Freios a disco',
        maxInstallments: 21,
        isActive: false
    },
    'x12': {
        id: 'x12',
        name: 'AMBTUS X12',
        price: 1056000,
        image: '/catalog2/Catalogo Ambtus Serra-_page-0017.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Banco Duplo, Sistema de freio Dianteiro/Traseiro',
        maxInstallments: 21,
        isActive: false
    },
    'sk10': {
        id: 'sk10',
        name: 'AMBTUS SK10',
        price: 600000,
        image: '/catalog2/Sk.jpeg',
        description: 'Potência 1000W',
        maxInstallments: 21,
        isActive: false
    },
    'sk8': {
        id: 'sk8',
        name: 'AMBTUS SK8',
        price: 400000,
        image: '/catalog2/Sk.jpeg',
        description: 'Potência 500W',
        maxInstallments: 21,
        isActive: false
    },

    // ---- Test Item ----
    'teste-1': {
        id: 'teste-1',
        name: 'TESTE R$1,00',
        price: 100, // R$ 1,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0005.jpg',
        description: 'Produto de Teste - Valor R$ 1,00',
        maxInstallments: 21
    }
}

export function getCatalogProduct(id: string): Product | null {
    return BIKES_CATALOG[id] || null
}

export function getActiveCatalog(): Product[] {
    return Object.values(BIKES_CATALOG).filter(p => p.isActive !== false)
}
