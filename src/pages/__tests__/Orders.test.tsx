import type { Order } from '@/domain/types/Order';
import { fireEvent, render, screen, waitFor } from '@/test/utils/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrdersPage from '../Orders';

// Mock useOrders hook
const mockUseOrders = {
    orders: [],
    loading: false,
    error: null,
    loadOrders: vi.fn(),
    updateOrderStatus: vi.fn()
};

vi.mock('@/hooks/useOrders', () => ({
    useOrders: () => mockUseOrders
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('OrdersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOrders.orders = [];
        mockUseOrders.loading = false;
        mockUseOrders.error = null;
    });

    it('應該顯示載入中狀態', () => {
        // Given: 載入中狀態
        mockUseOrders.loading = true;

        // When: 渲染頁面
        render(<OrdersPage />);

        // Then: 應該顯示載入中訊息
        expect(screen.getByText('載入訂單中...')).toBeInTheDocument();
        expect(screen.getByText('請稍候，正在取得您的訂單資料')).toBeInTheDocument();
    });

    it('應該顯示錯誤狀態', () => {
        // Given: 錯誤狀態
        mockUseOrders.error = '載入訂單失敗';

        // When: 渲染頁面
        render(<OrdersPage />);

        // Then: 應該顯示錯誤訊息
        expect(screen.getByRole('heading', { name: '載入訂單失敗' })).toBeInTheDocument();
        expect(screen.getByText('重新載入')).toBeInTheDocument();
        expect(screen.getByText('開始購物')).toBeInTheDocument();
    });

    it('應該顯示無訂單狀態', () => {
        // Given: 無訂單狀態
        mockUseOrders.orders = [];

        // When: 渲染頁面
        render(<OrdersPage />);

        // Then: 應該顯示無訂單訊息
        expect(screen.getByText('尚無訂單記錄')).toBeInTheDocument();
        expect(screen.getByText('開始購物來建立你的第一個訂單吧！')).toBeInTheDocument();
        expect(screen.getByText('開始購物')).toBeInTheDocument();
    });

    it('應該顯示訂單列表', () => {
        // Given: 有訂單資料
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        productName: '測試商品',
                        productPrice: 500,
                        productImage: '/test-image.jpg',
                        quantity: 2,
                        subtotal: 1000
                    }
                ]
            }
        ];
        mockUseOrders.orders = mockOrders;

        // When: 渲染頁面
        render(<OrdersPage />);

        // Then: 應該顯示訂單資訊
        expect(screen.getByText('我的訂單')).toBeInTheDocument();
        expect(screen.getByText('共 1 筆訂單')).toBeInTheDocument();
        expect(screen.getByText('訂單編號：ORD-20250108-000001')).toBeInTheDocument();
        expect(screen.getByText('等待確認')).toBeInTheDocument();
        expect(screen.getByText('測試商品')).toBeInTheDocument();
        expect(screen.getByText('數量：2')).toBeInTheDocument();
        expect(screen.getAllByText('NT$ 1,000')[0]).toBeInTheDocument();
        expect(screen.getByText((content, element) => {
            return element?.textContent === '收件人：測試客戶';
        })).toBeInTheDocument();
        expect(screen.getByText((content, element) => {
            return element?.textContent === '聯絡電話：0912345678';
        })).toBeInTheDocument();
        expect(screen.getByText((content, element) => {
            return element?.textContent === '收件地址：測試地址';
        })).toBeInTheDocument();
    });

    it('應該能夠重新載入訂單', () => {
        // Given: 有訂單資料
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];
        mockUseOrders.orders = mockOrders;

        // When: 渲染頁面並點擊重新載入
        render(<OrdersPage />);
        fireEvent.click(screen.getByText('重新載入'));

        // Then: 應該呼叫 loadOrders
        expect(mockUseOrders.loadOrders).toHaveBeenCalledTimes(1);
    });

    it('應該能夠更新訂單狀態', async () => {
        // Given: 有 pending 狀態的訂單
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];
        mockUseOrders.orders = mockOrders;
        mockUseOrders.updateOrderStatus.mockResolvedValue({ success: true });

        // When: 渲染頁面並點擊確認訂單
        render(<OrdersPage />);
        fireEvent.click(screen.getByText('確認訂單'));

        // Then: 應該呼叫 updateOrderStatus
        await waitFor(() => {
            expect(mockUseOrders.updateOrderStatus).toHaveBeenCalledWith({
                orderId: 'order-1',
                status: 'confirmed'
            });
        });
    });

    it('應該顯示不同狀態的訂單', () => {
        // Given: 不同狀態的訂單
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            },
            {
                id: 'order-2',
                orderNumber: 'ORD-20250108-000002',
                customerName: '測試客戶2',
                customerPhone: '0987654321',
                customerAddress: '測試地址2',
                totalAmount: 2000,
                status: 'confirmed',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T11:00:00Z'),
                updatedAt: new Date('2025-01-08T11:00:00Z'),
                items: []
            },
            {
                id: 'order-3',
                orderNumber: 'ORD-20250108-000003',
                customerName: '測試客戶3',
                customerPhone: '0911111111',
                customerAddress: '測試地址3',
                totalAmount: 3000,
                status: 'delivered',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T12:00:00Z'),
                updatedAt: new Date('2025-01-08T12:00:00Z'),
                items: []
            }
        ];
        mockUseOrders.orders = mockOrders;

        // When: 渲染頁面
        render(<OrdersPage />);

        // Then: 應該顯示不同狀態的訂單
        expect(screen.getByText('等待確認')).toBeInTheDocument();
        expect(screen.getByText('已確認')).toBeInTheDocument();
        expect(screen.getByText('已送達')).toBeInTheDocument();
        expect(screen.getByText('共 3 筆訂單')).toBeInTheDocument();
    });

    it('應該能夠導航到首頁', () => {
        // Given: 無訂單狀態
        mockUseOrders.orders = [];

        // When: 渲染頁面並點擊開始購物
        render(<OrdersPage />);
        fireEvent.click(screen.getByText('開始購物'));

        // Then: 應該導航到首頁
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('應該能夠導航到首頁（錯誤狀態）', () => {
        // Given: 錯誤狀態
        mockUseOrders.error = '載入訂單失敗';

        // When: 渲染頁面並點擊開始購物
        render(<OrdersPage />);
        fireEvent.click(screen.getByText('開始購物'));

        // Then: 應該導航到首頁
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
