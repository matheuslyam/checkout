export interface Product {
    id: string
    name: string
    price: number // Price in CENTS (e.g. 1264000 = R$ 12.640,00)
    image: string
    description: string
    maxInstallments: number
}

export const BIKES_CATALOG: Record<string, Product> = {
    'ambtus-flash': {
        id: 'ambtus-flash',
        name: 'AMBTUS FLASH',
        price: 749900, // R$ 7.499,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0005.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V, Freio Duplo Hidráulico, Suspensão Central, Display LCD Colorido',
        maxInstallments: 21,
    },
    'g60': {
        id: 'g60',
        name: 'AMBTUS G60',
        price: 699900, // R$ 6.999,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0003.jpg',
        description: 'Potência 1000W, Bateria 48V 15AH, Shimano 7 marchas, Autonomia 60km, Velocidade 32km/h',
        maxInstallments: 21
    },
    'v20-pro': {
        id: 'v20-pro',
        name: 'AMBTUS V20 PRO',
        price: 849900, // R$ 8.499,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0004.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Freios Hidráulicos, Autonomia 60km, Shimano 7 marchas',
        maxInstallments: 21
    },
    'q8': {
        id: 'q8',
        name: 'AMBTUS Q8',
        price: 849900, // R$ 8.499,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0006.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Freios Hidráulico zoom, Suspensão Dianteira, Shimano 7 marchas',
        maxInstallments: 21
    },
    'v10-max': {
        id: 'v10-max',
        name: 'AMBTUS V10 MAX',
        price: 799900, // R$ 7.999,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0007.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Freios a disco Dianteiro/Traseiro, Suspensão Dupla',
        maxInstallments: 21
    },
    'v8-pro': {
        id: 'v8-pro',
        name: 'AMBTUS V8 PRO',
        price: 799900, // R$ 7.999,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0008.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Freios Hidráulicos, Suspensão Dupla Traseira',
        maxInstallments: 21
    },
    'y16': {
        id: 'y16',
        name: 'AMBTUS Y16',
        price: 699900, // R$ 6.999,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0009.jpg',
        description: 'Potência 1000W, Bateria Lítio, Freio Disco Duplo, Amortecedor Dianteiro/Traseiro, Autonomia 84km',
        maxInstallments: 21
    },
    'ae6': {
        id: 'ae6',
        name: 'AMBTUS AE6',
        price: 859000, // R$ 8.590,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0010.jpg',
        description: 'Dobrável, Potência 750W, Bateria 48V 15AH, Freios a disco, Shimano 7 marchas',
        maxInstallments: 21
    },
    'ae7': {
        id: 'ae7',
        name: 'AMBTUS AE7',
        price: 819000, // R$ 8.190,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0011.jpg',
        description: 'Potência 750W, Bateria 48V 15AH, Freios a disco mecânicos, Amortecedor Hidráulico Dianteiro/Mola Traseiro',
        maxInstallments: 21
    },
    'c3': {
        id: 'c3',
        name: 'AMBTUS C3',
        price: 689000, // R$ 6.890,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0012.jpg',
        description: 'Potência 800W, Bateria 48V 24AH, Autonomia 75km, Freios a disco',
        maxInstallments: 21
    },
    'c10': {
        id: 'c10',
        name: 'AMBTUS C10',
        price: 799000, // R$ 7.990,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0013.jpg',
        description: 'Potência 1000W, Bateria Chumbo Ácido 5*15V 20AH, Autonomia 65km, Freios Hidráulicos',
        maxInstallments: 21
    },
    'c12': {
        id: 'c12',
        name: 'AMBTUS C12',
        price: 929000, // R$ 9.290,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0014.jpg',
        description: 'Potência 1000W, Bateria Lítio 60V 20AH, Autonomia 75km, Freios a disco, Banco com encosto',
        maxInstallments: 21
    },
    'c15': {
        id: 'c15',
        name: 'AMBTUS C15',
        price: 1029000, // R$ 10.290,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0015.jpg',
        description: 'Potência 1000W, Bateria Lítio 60V 20AH, Autonomia 65km, Amortecedor Hidráulico, Freios a disco',
        maxInstallments: 21
    },
    't3': {
        id: 't3',
        name: 'AMBTUS T3',
        price: 1159000, // R$ 11.590,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0016.jpg',
        description: 'Triciclo, Potência 1500W, Bateria Lítio 60V 20AH, Autonomia 65km, Freios a disco',
        maxInstallments: 21
    },
    'x12': {
        id: 'x12',
        name: 'AMBTUS X12',
        price: 1056000, // R$ 10.560,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0017.jpg',
        description: 'Potência 1000W, Bateria Lítio 48V 15AH, Banco Duplo, Sistema de freio Dianteiro/Traseiro',
        maxInstallments: 21
    },
    'teste-1': {
        id: 'teste-1',
        name: 'TESTE R$1,00',
        price: 100, // R$ 1,00
        image: '/catalog2/Catalogo Ambtus Serra-_page-0005.jpg', // Using generic image
        description: 'Produto de Teste - Valor R$ 1,00',
        maxInstallments: 12 // Limit installments for test
    }
}

export function getCatalogProduct(id: string): Product | null {
    return BIKES_CATALOG[id] || null
}
