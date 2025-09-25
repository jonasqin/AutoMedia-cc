import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch API
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  readAsBinaryString: vi.fn(),
  onload: null,
  onerror: null,
}));

// Mock next/navigation (for Next.js if needed)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test-path',
}));

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    control: vi.fn(),
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
  }),
  Controller: vi.fn(({ render }) => render({ field: {} })),
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
    isSuccess: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: vi.fn(() => null),
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => `formatted-${date}-${format}`),
  formatRelative: vi.fn(date => `relative-${date}`),
  parseISO: vi.fn(date => new Date(date)),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  isAfter: vi.fn((date1, date2) => date1 > date2),
  isBefore: vi.fn((date1, date2) => date1 < date2),
  differenceInDays: vi.fn((date1, date2) => Math.floor((date1 - date2) / (1000 * 60 * 60 * 24))),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: vi.fn(() => null),
  User: vi.fn(() => null),
  Settings: vi.fn(() => null),
  Plus: vi.fn(() => null),
  Edit: vi.fn(() => null),
  Trash: vi.fn(() => null),
  Save: vi.fn(() => null),
  X: vi.fn(() => null),
  Menu: vi.fn(() => null),
  Bell: vi.fn(() => null),
  Mail: vi.fn(() => null),
  Calendar: vi.fn(() => null),
  TrendingUp: vi.fn(() => null),
  Users: vi.fn(() => null),
  MessageSquare: vi.fn(() => null),
  Heart: vi.fn(() => null),
  Share: vi.fn(() => null),
  Download: vi.fn(() => null),
  Upload: vi.fn(() => null),
  Filter: vi.fn(() => null),
  SortAsc: vi.fn(() => null),
  SortDesc: vi.fn(() => null),
  RefreshCw: vi.fn(() => null),
  MoreVertical: vi.fn(() => null),
  ChevronDown: vi.fn(() => null),
  ChevronLeft: vi.fn(() => null),
  ChevronRight: vi.fn(() => null),
  Eye: vi.fn(() => null),
  EyeOff: vi.fn(() => null),
  Lock: vi.fn(() => null),
  Unlock: vi.fn(() => null),
  Check: vi.fn(() => null),
  XCircle: vi.fn(() => null),
  AlertCircle: vi.fn(() => null),
  Info: vi.fn(() => null),
  Loader: vi.fn(() => null),
}));

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: vi.fn(({ children }) => children),
  BarChart: vi.fn(({ children }) => children),
  PieChart: vi.fn(({ children }) => children),
  AreaChart: vi.fn(({ children }) => children),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
  Tooltip: vi.fn(() => null),
  Legend: vi.fn(() => null),
  Line: vi.fn(() => null),
  Bar: vi.fn(() => null),
  Pie: vi.fn(() => null),
  Area: vi.fn(() => null),
  CartesianGrid: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => children),
}));

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});