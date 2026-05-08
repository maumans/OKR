import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/Components/ui/Card';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import EmptyState from '@/Components/EmptyState';

export default function ReportingIndex() {
    return (
        <AppLayout title="Reporting">
            <div className="mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporting & Synthèse</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Analysez les performances de votre entreprise</p>
                </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-0">
                        <EmptyState
                            icon={BarChart3}
                            title="Module Reporting"
                            description="Ce module sera bientôt disponible. Vous pourrez visualiser des synthèses mensuelles, des graphiques de performance et exporter des rapports."
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </AppLayout>
    );
}
