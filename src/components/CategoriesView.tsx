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
        return { label: 'Receita', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' };
      case 'expense':
        return { label: 'Despesa', badge: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold' };
      default:
        return { label: 'Projeto', badge: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold' };
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 border border-emerald-200">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Categorias do Sistema</h2>
            <p className="text-xs text-slate-600 font-bold mt-0.5">Organize suas receitas, despesas e projetos por categoria</p>
          </div>
        </div>

        <button
          onClick={onOpenNewCategoryModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 font-semibold placeholder-slate-400 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-600" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
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
          <div className="col-span-full text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
            <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-700 font-black">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const { label, badge } = getTypeLabel(cat.type);
            return (
              <div
                key={cat.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-slate-200"
                        style={{ backgroundColor: cat.color || '#10B981' }}
                      />
                      <h3 className="font-black text-slate-900 text-sm">{cat.name}</h3>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${badge}`}>
                      {label}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-slate-600 font-semibold mb-4 line-clamp-2">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onEditCategory(cat)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
