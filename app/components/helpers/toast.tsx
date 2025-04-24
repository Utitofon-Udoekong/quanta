import toast from 'react-hot-toast';

export { toast };

// Add type support
declare type ToastType = 'success' | 'error' | 'info' | 'warning';

// Override the toast function to support our type parameter
export function showToast(message: string, type: ToastType = 'info') {
    switch (type) {
        case 'success':
            toast.success(message);
            break;
        case 'error':
            toast.error(message);
            break;
        case 'info':
            toast(message);
            break;
        case 'warning':
            toast(message, {
                icon: '⚠️',
            });
            break;
        default:
            toast(message);
    }
}

