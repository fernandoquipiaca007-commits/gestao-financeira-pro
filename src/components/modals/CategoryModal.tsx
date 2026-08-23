import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { CategoryItem } from '../../types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
      <div className="bg-white border border-[#c4c7c7]/30 rounded-[24px] w-full max-w-md shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#c4c7c7]/40 bg-[#f7f3f2]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f1edec] text-[#444747]">
              <Tag className="w-4 h-4 stroke-[2]" />
            </div>
            <h3 className="font-semibold text-[#1c1b1b] text-base">
              {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#747878] hover:bg-[#f1edec] hover:text-[#1c1b1b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trafego Pago, Hospedagem..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Tipo de Categoria
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] focus:outline-none focus:border-[#000000] focus:bg-white transition-all"
            >
              <option value="income">Receita (Entrada)</option>
              <option value="expense">Despesa (Saida)</option>
              <option value="project">Projeto</option>
            </select>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Cor de Identificacao
            </label>
            <div className="flex items-center space-x-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer border-2 ${
                    color === c
                      ? 'border-[#000000] scale-110'
                      : 'border-[#c4c7c7] opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-[#747878] uppercase tracking-widest block mb-1.5">
              Descricao (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Finalidade desta categoria..."
              className="w-full bg-[#f1edec] border border-[#c4c7c7]/35 rounded-xl px-3.5 py-2.5 text-sm text-[#1c1b1b] placeholder-[#747878] focus:outline-none focus:border-[#000000] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#c4c7c7]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[29px] bg-[#f1edec] text-[#1c1b1b] text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] hover:opacity-85 text-white text-sm font-medium rounded-[29px] cursor-pointer active:scale-95 transition-all"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
