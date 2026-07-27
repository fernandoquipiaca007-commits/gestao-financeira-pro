import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { CategoryItem } from '../types';

interface CategoriesViewProps {
  categories: CategoryItem[];
  onOpenNewCategoryModal: () => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function CategoriesView({
  categories,
  onOpenNewCategoryModal,
  onEditCategory,
  onDeleteCategory,
}: CategoriesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense' | 'project'>('ALL');

  const filteredCategories = categories.filter((cat) => {
    const matchesType = typeFilter === 'ALL' || cat.type === typeFilter;
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return { label: 'Receita', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'expense':
        return { label: 'Despesa', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      default:
        return { label: 'Projeto', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Categorias do Sistema</h2>
            <p className="text-xs text-slate-400">Organize suas receitas, despesas e projetos por categoria</p>
          </div>
        </div>

        <button
          onClick={onOpenNewCategoryModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="income">Apenas Receitas</option>
            <option value="expense">Apenas Despesas</option>
            <option value="project">Apenas Projetos</option>
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const { label, badge } = getTypeLabel(cat.type);
            return (
              <div
                key={cat.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color || '#10B981' }}
                      />
                      <h3 className="font-bold text-white text-base">{cat.name}</h3>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge}`}>
                      {label}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => onEditCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
