// src/components/ui/Skeleton.tsx

interface SkeletonProps {
    variant?: 'card' | 'chart' | 'row' | 'text' | 'kpi';
    className?: string;
}

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
    switch (variant) {
        case 'kpi':
            return (
                <div className={`metric-card ${className}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2 flex-1">
                            <div className="skeleton h-3 w-20" />
                            <div className="skeleton h-8 w-32" />
                        </div>
                        <div className="skeleton h-11 w-11 rounded-xl" />
                    </div>
                    <div className="skeleton h-3 w-24" />
                </div>
            );
        case 'chart':
            return (
                <div className={`glass-card p-6 ${className}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-2">
                            <div className="skeleton h-5 w-40" />
                            <div className="skeleton h-3 w-56" />
                        </div>
                        <div className="skeleton h-8 w-24 rounded-lg" />
                    </div>
                    <div className="skeleton h-[280px] w-full rounded-xl" />
                </div>
            );
        case 'card':
            return (
                <div className={`glass-card p-6 ${className}`}>
                    <div className="space-y-3">
                        <div className="skeleton h-5 w-32" />
                        <div className="skeleton h-3 w-full" />
                        <div className="skeleton h-3 w-3/4" />
                    </div>
                </div>
            );
        case 'row':
            return (
                <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
                    <div className="skeleton h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3.5 w-40" />
                        <div className="skeleton h-2.5 w-24" />
                    </div>
                    <div className="skeleton h-4 w-20" />
                </div>
            );
        default:
            return <div className={`skeleton h-4 w-full ${className}`} />;
    }
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="kpi" />
                ))}
            </div>
            {/* Charts */}
            <Skeleton variant="chart" className="h-[420px]" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Skeleton variant="chart" className="h-[400px]" />
                <Skeleton variant="chart" className="h-[400px]" />
            </div>
        </div>
    );
}
