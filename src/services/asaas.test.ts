import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock axios instance
const mockGet = vi.fn()
const mockPost = vi.fn()

// Mock axios
vi.mock('axios', () => ({
    default: {
        create: () => ({
            get: mockGet,
            post: mockPost,
        }),
    },
}))

// Import schemas and service class (not the singleton)
import {
    AsaasService,
    CustomerSchema,
    PixPaymentSchema,
    CardPaymentSchema
} from './asaas'

describe('AsaasService', () => {
    let service: AsaasService

    beforeEach(() => {
        vi.clearAllMocks()
        // Create service with injected config (no env dependency)
        service = new AsaasService({
            apiKey: 'test_api_key_12345',
            apiUrl: 'https://sandbox.asaas.com/api/v3'
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ============================================
    // Schema Validation Tests
    // ============================================
    describe('Schema Validation', () => {
        describe('CustomerSchema', () => {
            it('should validate a valid customer', () => {
                const validCustomer = {
                    name: 'João Silva',
                    email: 'joao@email.com',
                    cpfCnpj: '12345678901',
                }

                const result = CustomerSchema.safeParse(validCustomer)
                expect(result.success).toBe(true)
            })

            it('should reject invalid email', () => {
                const invalidCustomer = {
                    name: 'João Silva',
                    email: 'invalid-email',
                    cpfCnpj: '12345678901',
                }

                const result = CustomerSchema.safeParse(invalidCustomer)
                expect(result.success).toBe(false)
            })

            it('should reject invalid CPF (wrong length)', () => {
                const invalidCustomer = {
                    name: 'João Silva',
                    email: 'joao@email.com',
                    cpfCnpj: '123456789',
                }

                const result = CustomerSchema.safeParse(invalidCustomer)
                expect(result.success).toBe(false)
            })

            it('should accept CNPJ with 14 digits', () => {
                const validCompany = {
                    name: 'Empresa LTDA',
                    email: 'empresa@email.com',
                    cpfCnpj: '12345678901234',
                }

                const result = CustomerSchema.safeParse(validCompany)
                expect(result.success).toBe(true)
            })
        })

        describe('PixPaymentSchema', () => {
            it('should validate a valid PIX payment', () => {
                const validPayment = {
                    customerId: 'cus_123456',
                    value: 6999.00,
                    dueDate: '2024-12-31',
                    description: 'Bike Elétrica Ambtus',
                }

                const result = PixPaymentSchema.safeParse(validPayment)
                expect(result.success).toBe(true)
            })

            it('should reject negative value', () => {
                const invalidPayment = {
                    customerId: 'cus_123456',
                    value: -100,
                    dueDate: '2024-12-31',
                }

                const result = PixPaymentSchema.safeParse(invalidPayment)
                expect(result.success).toBe(false)
            })

            it('should reject invalid date format', () => {
                const invalidPayment = {
                    customerId: 'cus_123456',
                    value: 100,
                    dueDate: '31/12/2024',
                }

                const result = PixPaymentSchema.safeParse(invalidPayment)
                expect(result.success).toBe(false)
            })
        })

        describe('CardPaymentSchema', () => {
            it('should validate a valid card payment', () => {
                const validPayment = {
                    customerId: 'cus_123456',
                    value: 6999.00,
                    installmentCount: 12,
                    creditCardToken: 'token_abc123',
                    creditCardHolderInfo: {
                        name: 'João Silva',
                        email: 'joao@email.com',
                        cpfCnpj: '12345678901',
                        postalCode: '01310100',
                        addressNumber: '123',
                    },
                    dueDate: '2024-12-31',
                }

                const result = CardPaymentSchema.safeParse(validPayment)
                expect(result.success).toBe(true)
            })

            it('should reject installment count over 21', () => {
                const invalidPayment = {
                    customerId: 'cus_123456',
                    value: 6999.00,
                    installmentCount: 24,
                    creditCardToken: 'token_abc123',
                    creditCardHolderInfo: {
                        name: 'João Silva',
                        email: 'joao@email.com',
                        cpfCnpj: '12345678901',
                        postalCode: '01310100',
                        addressNumber: '123',
                    },
                    dueDate: '2024-12-31',
                }

                const result = CardPaymentSchema.safeParse(invalidPayment)
                expect(result.success).toBe(false)
            })
        })
    })

    // ============================================
    // Service Method Tests
    // ============================================
    describe('Service Methods', () => {
        describe('createCustomer', () => {
            it('should return existing customer if found', async () => {
                const existingCustomer = {
                    id: 'cus_existing123',
                    name: 'João Silva',
                    email: 'joao@email.com',
                    cpfCnpj: '12345678901',
                }

                mockGet.mockResolvedValueOnce({
                    data: { data: [existingCustomer] },
                })

                const result = await service.createCustomer({
                    name: 'João Silva',
                    email: 'joao@email.com',
                    cpfCnpj: '12345678901',
                })

                expect(result).toEqual(existingCustomer)
                expect(mockPost).not.toHaveBeenCalled()
            })

            it('should create new customer if not found', async () => {
                const newCustomer = {
                    id: 'cus_new123',
                    name: 'Maria Santos',
                    email: 'maria@email.com',
                    cpfCnpj: '98765432101',
                }

                mockGet.mockResolvedValueOnce({ data: { data: [] } })
                mockPost.mockResolvedValueOnce({ data: newCustomer })

                const result = await service.createCustomer({
                    name: 'Maria Santos',
                    email: 'maria@email.com',
                    cpfCnpj: '98765432101',
                })

                expect(result).toEqual(newCustomer)
                expect(mockPost).toHaveBeenCalledWith('/customers', {
                    name: 'Maria Santos',
                    email: 'maria@email.com',
                    cpfCnpj: '98765432101',
                })
            })
        })

        describe('createPixPayment', () => {
            it('should create PIX payment and return QR code', async () => {
                const paymentResponse = {
                    id: 'pay_pix123',
                    status: 'PENDING',
                    value: 6999.00,
                    netValue: 6929.00,
                    billingType: 'PIX',
                }

                const qrCodeResponse = {
                    id: 'qr_123',
                    encodedImage: 'base64_qr_code_image_here',
                    payload: '00020126580014br.gov.bcb.pix...',
                    expirationDate: '2024-12-31T23:59:59',
                }

                mockPost.mockResolvedValueOnce({ data: paymentResponse })
                mockGet.mockResolvedValueOnce({ data: qrCodeResponse })

                const result = await service.createPixPayment({
                    customerId: 'cus_123456',
                    value: 6999.00,
                    dueDate: '2024-12-31',
                    description: 'Bike Elétrica',
                })

                expect(result.id).toBe('pay_pix123')
                expect(result.pixQrCode.encodedImage).toBe('base64_qr_code_image_here')
                expect(result.pixQrCode.payload).toContain('00020126')
            })
        })

        describe('createCardPayment', () => {
            it('should create card payment with installments', async () => {
                const paymentResponse = {
                    id: 'pay_card123',
                    status: 'CONFIRMED',
                    value: 6999.00,
                    netValue: 6649.00,
                    billingType: 'CREDIT_CARD',
                }

                mockPost.mockResolvedValueOnce({ data: paymentResponse })

                const result = await service.createCardPayment({
                    customerId: 'cus_123456',
                    value: 6999.00,
                    installmentCount: 12,
                    creditCardToken: 'token_abc123',
                    creditCardHolderInfo: {
                        name: 'João Silva',
                        email: 'joao@email.com',
                        cpfCnpj: '12345678901',
                        postalCode: '01310100',
                        addressNumber: '123',
                    },
                    dueDate: '2024-12-31',
                })

                expect(result.id).toBe('pay_card123')
                expect(result.billingType).toBe('CREDIT_CARD')
                expect(mockPost).toHaveBeenCalledWith('/payments', expect.objectContaining({
                    billingType: 'CREDIT_CARD',
                    installmentCount: 12,
                }))
            })
        })

        describe('getPaymentStatus', () => {
            it('should return payment status', async () => {
                const paymentStatus = {
                    id: 'pay_123',
                    status: 'CONFIRMED',
                    value: 6999.00,
                    netValue: 6649.00,
                    billingType: 'PIX',
                }

                mockGet.mockResolvedValueOnce({ data: paymentStatus })

                const result = await service.getPaymentStatus('pay_123')

                expect(result.status).toBe('CONFIRMED')
                expect(mockGet).toHaveBeenCalledWith('/payments/pay_123')
            })
        })
    })
})
