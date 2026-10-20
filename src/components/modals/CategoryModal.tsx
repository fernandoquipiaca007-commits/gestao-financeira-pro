import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { CategoryItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<CategoryItem, 'id' | 'createdAt'> & { id?: string }) => void;
  categoryToEdit?: CategoryItem | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}: CategoryModalProps) {
  const { lang } = useLanguage();
  const isEn = lang === 'en';
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'project'>('income');
  const [color, setColor] = useState('#10B981');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color || '#10B981');
      setDescription(categoryToEdit.description || '');
    } else {
      setName('');
      setType('income');
      setColor('#10B981');
      setDescription('');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: categoryToEdit?.id,
      name: name.trim(),
      type,
      color,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const presetColors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#64748B'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(18,17,14,0.34)] backdrop-blur-sm font-sans">
      <div className="bg-glass-strong border border-line-subtle rounded-xl w-full max-w-md shadow-xl overflow-hidden backdrop-blur-[56px]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-line-subtle bg-surface-2 ">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-fg-secondary ">
              <Tag className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="font-semibold text-fg text-base">
              {categoryToEdit ? (isEn ? 'Edit category' : 'Editar categoria') : (isEn ? 'New category' : 'Nova categoria')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-fg-muted hover:bg-sunken hover:text-fg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Category Name *' : 'Nome da Categoria *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Paid Traffic, Hosting...' : 'Ex: Tráfego Pago, Hospedagem...'}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Category Type' : 'Tipo de Categoria'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all cursor-pointer"
            >
              <option value="income" className="bg-glass-strong text-fg ">
                {isEn ? 'Income (Inflow)' : 'Receita (Entrada)'}
              </option>
              <option value="expense" className="bg-glass-strong text-fg ">
                {isEn ? 'Expense (Outflow)' : 'Despesa (Saída)'}
              </option>
              <option value="project" className="bg-glass-strong text-fg ">
                {isEn ? 'Project' : 'Projeto'}
              </option>
            </select>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Identification Color' : 'Cor de Identificação'}
            </label>
            <div className="flex items-center space-x-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer border-2 ${
 color === c
 ? 'border-fg scale-110'
 : 'border-line opacity-80 hover:opacity-100'
 }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[13px] font-medium text-fg-secondary block mb-1.5">
              {isEn ? 'Description (Optional)' : 'Descrição (Opcional)'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isEn ? 'Purpose of this category...' : 'Finalidade desta categoria...'}
              className="w-full bg-surface-2 border border-line-subtle rounded-md px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-accent focus:bg-surface-1 focus:shadow-[0_0_0_4px_var(--accent-ring)] transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-line-subtle ">
            <button
              type="button"
              onClick={onClose}
              className="aura-btn aura-btn--secondary"
            >
              {isEn ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              className="aura-btn aura-btn--primary"
            >
              {isEn ? 'Save Category' : 'Guardar Categoria'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
