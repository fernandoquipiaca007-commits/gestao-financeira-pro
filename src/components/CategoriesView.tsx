import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, Filter, FolderKanban, CheckSquare, ArrowRight } from 'lucide-react';
import { CategoryItem, Project } from '../types';
import { Task } from '../types/rbac';
import { useLanguage } from '../contexts/LanguageContext';

interface CategoriesViewProps {
  categories: CategoryItem[];
  projects?: Project[];
  tasks?: Task[];
  onOpenNewCategoryModal: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
  onNavigateTab?: (tab: string, filter?: string) => void;
}

export function CategoriesView({
  categories,
  projects = [],
  tasks = [],
  onOpenNewCategoryModal,
  onEditCategory,
  onDeleteCategory,
  onNavigateTab,
}: CategoriesViewProps) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense' | 'project'>('ALL');

  const filteredCategories = categories.filter((cat) => {
    const matchesType = typeFilter === 'ALL' || cat.type === typeFilter;
    const matchesSearch =
      (cat?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return { label: isEn ? 'Income' : 'Receita', badge: 'bg-success-soft text-success-fg ' };
      case 'expense':
        return { label: isEn ? 'Expense' : 'Despesa', badge: 'bg-danger-soft text-danger-fg ' };
      default:
        return { label: isEn ? 'Project' : 'Projeto', badge: 'bg-accent-soft text-accent-soft-fg ' };
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="font-display font-normal text-[32px] sm:text-[38px] leading-tight tracking-[-0.03em] text-fg m-0">
              {isEn ? 'System Categories' : 'Categorias do Sistema'}
            </h2>
            <p className="text-[15px] text-fg-secondary mt-1.5 mb-0">
              {isEn ? 'Organize your tasks, projects, income, and expenses by category' : 'Organize suas tarefas, projetos, receitas e despesas por categoria'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewCategoryModal}
          className="aura-btn aura-btn--primary w-full sm:w-auto justify-center shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{isEn ? 'New category' : 'Nova categoria'}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-glass p-4 rounded-xl border border-line-subtle shadow-glass">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-fg-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search category...' : 'Buscar categoria...'}
            className="w-full bg-surface-2 border border-line-subtle rounded-full pl-9 pr-4 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-fg-muted " />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-surface-2 border border-line-subtle rounded-full px-4 py-2 text-sm text-fg font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">{isEn ? 'All categories' : 'Todas as categorias'}</option>
            <option value="income">{isEn ? 'Income Only' : 'Apenas Receitas'}</option>
            <option value="expense">{isEn ? 'Expenses Only' : 'Apenas Despesas'}</option>
            <option value="project">{isEn ? 'Projects Only' : 'Apenas Projetos'}</option>
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-line-subtle rounded-xl bg-glass ">
            <Tag className="w-8 h-8 text-fg-disabled mx-auto mb-2" />
            <p className="text-sm text-fg-muted font-medium">
              {isEn ? 'No categories found.' : 'Nenhuma categoria encontrada.'}
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const { label, badge } = getTypeLabel(cat.type);
            const catNameLower = (cat?.name || '').toLowerCase();
            const projectCount = projects.filter(
              p => p.category?.toLowerCase() === catNameLower
            ).length;
            const taskCount = tasks.filter(t => {
              if (t.category?.toLowerCase() === catNameLower) return true;
              if (t.projectId) {
                 const p = projects.find(proj => proj.id === t.projectId);
                 return p?.category?.toLowerCase() === catNameLower;
              }
              return false;
            }).length;

            return (
              <div
                key={cat.id}
                className="bg-glass border border-line-subtle hover:border-line-strong rounded-xl p-5 shadow-glass hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-line-subtle "
                        style={{ backgroundColor: cat.color || '#10B981' }}
                      />
                      <h3 className="font-semibold text-fg text-base">{cat.name}</h3>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                      {label}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-fg-muted mb-3 line-clamp-2">{cat.description}</p>
                  )}

                  {/* Connected Projects and Tasks Counters */}
                  <div className="flex items-center gap-3 pt-2 text-xs text-fg-muted ">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <FolderKanban className="w-3.5 h-3.5 text-accent-soft-fg " />
                      {projectCount} {projectCount === 1 ? (isEn ? 'project' : 'projeto') : (isEn ? 'projects' : 'projetos')}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <CheckSquare className="w-3.5 h-3.5 text-success-fg " />
                      {taskCount} {taskCount === 1 ? (isEn ? 'task' : 'tarefa') : (isEn ? 'tasks' : 'tarefas')}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-line-subtle ">
                  <div className="flex items-center gap-1.5">
                    {onNavigateTab && (
                      <>
                        <button
                          onClick={() => onNavigateTab('tasks', cat.name)}
                          className="text-[11px] font-medium text-accent-soft-fg hover:underline flex items-center gap-0.5 cursor-pointer"
                          title={isEn ? `View tasks in category ${cat.name}` : `Ver tarefas da categoria ${cat.name}`}
                        >
                          <span>{isEn ? 'Tasks' : 'Tarefas'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <span className="text-fg-disabled ">|</span>
                        <button
                          onClick={() => onNavigateTab('projects', cat.name)}
                          className="text-[11px] font-medium text-accent-soft-fg hover:underline flex items-center gap-0.5 cursor-pointer"
                          title={isEn ? `View projects in category ${cat.name}` : `Ver projetos da categoria ${cat.name}`}
                        >
                          <span>{isEn ? 'Projects' : 'Projetos'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-1.5 text-fg-muted hover:text-fg hover:bg-sunken rounded-full transition-colors cursor-pointer"
                      title={isEn ? 'Edit' : 'Editar'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-fg-muted hover:text-danger-fg hover:bg-danger-soft rounded-full transition-colors cursor-pointer"
                      title={isEn ? 'Delete' : 'Eliminar'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
