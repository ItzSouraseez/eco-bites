'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Toast from '@/components/Toast';

export default function AdminPanel() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const loginTime = localStorage.getItem('adminLoginTime');
    
    // Check if session is valid (24 hours)
    if (isAuthenticated && loginTime) {
      const timeDiff = Date.now() - parseInt(loginTime);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setAuthenticated(true);
        loadPendingProducts();
      } else {
        localStorage.removeItem('adminAuthenticated');
        localStorage.removeItem('adminLoginTime');
        router.push('/admin/login');
      }
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const loadPendingProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'pendingProducts'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      setPendingProducts(products);
    } catch (error) {
      console.error('Error loading pending products:', error);
      showToast('Failed to load pending products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, isVisible: false });
  };

  const handleApprove = async (product) => {
    setProcessingId(product.id);
    try {
      // Move to sharedProducts
      const { id, ...productData } = product;
      await addDoc(collection(db, 'sharedProducts'), {
        ...productData,
        approved: true,
        approvedAt: serverTimestamp(),
        verified: true,
      });

      // Remove from pendingProducts
      await deleteDoc(doc(db, 'pendingProducts', id));

      showToast('Product approved and added to shared database', 'success');
      loadPendingProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      showToast('Failed to approve product', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (productId) => {
    if (!confirm('Are you sure you want to reject this product?')) {
      return;
    }

    setProcessingId(productId);
    try {
      await deleteDoc(doc(db, 'pendingProducts', productId));
      showToast('Product rejected and removed', 'success');
      loadPendingProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      showToast('Failed to reject product', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    router.push('/admin/login');
  };

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Review and approve product contributions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPendingProducts}
              className="px-6 py-3 bg-white/70 hover:bg-white/90 border border-white/50 text-gray-700 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="text-sm text-gray-600 mb-1">Pending Reviews</div>
            <div className="text-3xl font-bold text-gray-900">{pendingProducts.length}</div>
          </div>
        </div>

        {/* Pending Products List */}
        {pendingProducts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/50 shadow-lg">
            <p className="text-gray-600 text-lg">No pending products to review</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-white/50 shadow-lg"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Product Images */}
                  <div className="space-y-4">
                    {product.productImageUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                        <img
                          src={product.productImageUrl}
                          alt="Product"
                          className="w-full rounded-2xl border border-gray-200"
                        />
                      </div>
                    )}
                    {product.nutritionImageUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nutrition Label</label>
                        <img
                          src={product.nutritionImageUrl}
                          alt="Nutrition Label"
                          className="w-full rounded-2xl border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {product.productName}
                      </h3>
                      {product.brand && (
                        <p className="text-gray-600 mb-4">Brand: {product.brand}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Energy</div>
                        <div className="text-lg font-semibold">{product.nutrition?.energy || 0} kcal</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Fat</div>
                        <div className="text-lg font-semibold">{product.nutrition?.fat || 0}g</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Sugars</div>
                        <div className="text-lg font-semibold">{product.nutrition?.sugars || 0}g</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Protein</div>
                        <div className="text-lg font-semibold">{product.nutrition?.protein || 0}g</div>
                      </div>
                    </div>

                    {product.ingredients && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Ingredients</div>
                        <p className="text-sm text-gray-600">{product.ingredients}</p>
                      </div>
                    )}

                    {product.allergens && product.allergens.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Allergens</div>
                        <p className="text-sm text-gray-600">{product.allergens.join(', ')}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleApprove(product)}
                        disabled={processingId === product.id}
                        className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        {processingId === product.id ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(product.id)}
                        disabled={processingId === product.id}
                        className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {processingId === product.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </div>
  );
}

