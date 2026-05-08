import { Head, Link } from '@inertiajs/react';
import { Card } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { ArrowLeft, BookOpen, ChevronRight, Menu, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function LmsLearn({ formation, currentModule }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Trouver les modules précédent et suivant
    const currentIndex = formation.modules.findIndex(m => m.id === currentModule.id);
    const prevModule = currentIndex > 0 ? formation.modules[currentIndex - 1] : null;
    const nextModule = currentIndex < formation.modules.length - 1 ? formation.modules[currentIndex + 1] : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col">
            <Head title={`${currentModule.titre} - ${formation.titre}`} />

            {/* Navbar */}
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-4 flex-1">
                    <Button variant="outline" size="icon" asChild className="shrink-0 h-9 w-9">
                        <Link href={route('formations.show', formation.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="hidden sm:block">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Formation</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{formation.titre}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className={`fixed inset-y-0 left-0 z-20 mt-16 w-72 transform border-r border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 transition-transform duration-200 ease-in-out md:static md:mt-0 md:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-950/50 flex-shrink-0">
                        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary-500" /> Sommaire
                        </h2>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-dark-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary-500 rounded-full" 
                                    style={{ width: `${Math.max(5, ((currentIndex + 1) / formation.modules.length) * 100)}%` }}
                                ></div>
                            </div>
                            <span className="shrink-0 font-medium">{currentIndex + 1} / {formation.modules.length}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {formation.modules.map((mod, index) => {
                            const isCurrent = mod.id === currentModule.id;
                            const isPassed = index < currentIndex;
                            
                            return (
                                <Link 
                                    key={mod.id} 
                                    href={route('formations.modules.show', [formation.id, mod.id])}
                                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        isCurrent 
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                                    }`}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {isPassed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : isCurrent ? (
                                            <div className="h-4 w-4 rounded-full border-2 border-primary-500 bg-white dark:bg-dark-900 flex items-center justify-center">
                                                <div className="h-1.5 w-1.5 bg-primary-500 rounded-full"></div>
                                            </div>
                                        ) : (
                                            <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-sm line-clamp-2">
                                        {mod.titre}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                {/* Overlay mobile */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 z-10 bg-slate-900/50 backdrop-blur-sm md:hidden mt-16" 
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Contenu principal */}
                <main className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {currentModule.titre}
                            </h1>
                        </div>

                        <Card className="shadow-sm border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900">
                            <div className="p-6 sm:p-10 prose dark:prose-invert max-w-none prose-slate prose-headings:font-bold prose-a:text-primary-600 dark:prose-a:text-primary-400">
                                {currentModule.contenu ? (
                                    <div className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {currentModule.contenu}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-dark-800 mb-4">
                                            <FileText className="h-6 w-6 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Module vide</h3>
                                        <p className="mt-1 text-slate-500">Ce module ne contient pas encore de contenu.</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Navigation Footer */}
                        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200 dark:border-dark-800">
                            {prevModule ? (
                                <Button asChild variant="outline" className="w-full sm:w-auto min-w-[140px] justify-start gap-2">
                                    <Link href={route('formations.modules.show', [formation.id, prevModule.id])}>
                                        <ArrowLeft className="h-4 w-4" />
                                        Précédent
                                    </Link>
                                </Button>
                            ) : (
                                <div></div> // Spacer
                            )}

                            {nextModule ? (
                                <Button asChild variant="default" className="w-full sm:w-auto min-w-[140px] justify-end gap-2">
                                    <Link href={route('formations.modules.show', [formation.id, nextModule.id])}>
                                        Suivant
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="default" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 justify-center gap-2">
                                    <Link href={route('formations.show', formation.id)}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Terminer la formation
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
