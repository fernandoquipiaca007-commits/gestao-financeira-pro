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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 border border-emerald-200">
              <Tag className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="font-black text-slate-900 text-base">
              {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tráfego Pago, Hospedagem..."
              className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Tipo de Categoria
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none transition-all"
            >
              <option value="income">Receita (Entrada)</option>
              <option value="expense">Despesa (Saída)</option>
              <option value="project">Projeto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex items-center space-x-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all cursor-pointer ${
                    color === c ? 'ring-2 ring-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Finalidade desta categoria..."
              className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
