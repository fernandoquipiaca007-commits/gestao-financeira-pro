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
        return { label: 'Receita', badge: 'bg-[#d4eddf] text-[#1a6b3a]' };
      case 'expense':
        return { label: 'Despesa', badge: 'bg-[#ffdad6] text-[#93000a]' };
      default:
        return { label: 'Projeto', badge: 'bg-[#dbe1ff] text-[#003da9]' };
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#f1edec] text-[#1c1b1b] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1c1b1b] tracking-tight">Categorias do Sistema</h2>
            <p className="text-xs text-[#747878] mt-0.5">Organize suas receitas, despesas e projetos por categoria</p>
          </div>
        </div>

        <button
          onClick={onOpenNewCategoryModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#000000] hover:opacity-85 text-white font-medium text-sm rounded-[29px] transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[22px] border border-[#c4c7c7]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#747878] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full pl-9 pr-4 py-2 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#747878]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-[#f1edec] border border-[#c4c7c7]/35 rounded-full px-4 py-2 text-sm text-[#1c1b1b] font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="income">Apenas Receitas</option>
            <option value="expense">Apenas Despesas</option>
            <option value="project">Apenas Projetos</option>
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-[#c4c7c7]/30 rounded-[22px] bg-white">
            <Tag className="w-8 h-8 text-[#c4c7c7] mx-auto mb-2" />
            <p className="text-sm text-[#747878] font-medium">Nenhuma categoria encontrada.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const { label, badge } = getTypeLabel(cat.type);
            return (
              <div
                key={cat.id}
                className="bg-white border border-[#c4c7c7]/40 hover:border-[#c4c7c7] rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-[#c4c7c7]/40"
                        style={{ backgroundColor: cat.color || '#10B981' }}
                      />
                      <h3 className="font-semibold text-[#1c1b1b] text-base">{cat.name}</h3>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                      {label}
                    </span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-[#747878] mb-4 line-clamp-2">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-1 pt-3 border-t border-[#c4c7c7]/40">
                  <button
                    onClick={() => onEditCategory(cat)}
                    className="p-1.5 text-[#747878] hover:text-[#1c1b1b] hover:bg-[#f1edec] rounded-full transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-[#747878] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-full transition-colors cursor-pointer"
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
