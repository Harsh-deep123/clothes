import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  const measurements = [
    { size: 'S (38R)', chest: unit === 'inches' ? '36-38"' : '91-96 cm', shoulder: unit === 'inches' ? '17.5"' : '44.5 cm', length: unit === 'inches' ? '29.5"' : '75 cm', sleeve: unit === 'inches' ? '33.5"' : '85 cm' },
    { size: 'M (40R)', chest: unit === 'inches' ? '38-40"' : '97-102 cm', shoulder: unit === 'inches' ? '18.2"' : '46.2 cm', length: unit === 'inches' ? '30.2"' : '76.8 cm', sleeve: unit === 'inches' ? '34.5"' : '87.5 cm' },
    { size: 'L (42R)', chest: unit === 'inches' ? '41-43"' : '104-109 cm', shoulder: unit === 'inches' ? '19.0"' : '48.3 cm', length: unit === 'inches' ? '31.0"' : '78.7 cm', sleeve: unit === 'inches' ? '35.5"' : '90 cm' },
    { size: 'XL (44R)', chest: unit === 'inches' ? '44-46"' : '112-117 cm', shoulder: unit === 'inches' ? '19.8"' : '50.3 cm', length: unit === 'inches' ? '31.8"' : '80.8 cm', sleeve: unit === 'inches' ? '36.5"' : '92.5 cm' },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-2xl p-6 md:p-8 shadow-2xl border border-[#cfc4c5]/30 z-10 animate-scale-in">
        <div className="flex justify-between items-center pb-4 border-b border-[#cfc4c5]/30 mb-6">
          <div>
            <h2 className="font-serif-luxury text-2xl text-black">Architectural Tailoring Size Guide</h2>
            <p className="text-xs text-[#5d5f5f] mt-1 font-light">All measurements reflect finished garment dimensions.</p>
          </div>
          <button onClick={onClose} className="p-2 text-black hover:opacity-60 -mr-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex justify-end mb-4">
          <div className="border border-[#cfc4c5] p-0.5 flex text-xs uppercase tracking-wider font-semibold">
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 transition-colors ${unit === 'inches' ? 'bg-black text-white' : 'text-[#5d5f5f] hover:text-black'}`}
            >
              Inches
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 transition-colors ${unit === 'cm' ? 'bg-black text-white' : 'text-[#5d5f5f] hover:text-black'}`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-black uppercase tracking-wider font-semibold">
                <th className="py-3 px-2">Size</th>
                <th className="py-3 px-2">Chest</th>
                <th className="py-3 px-2">Shoulder</th>
                <th className="py-3 px-2">Length</th>
                <th className="py-3 px-2">Sleeve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfc4c5]/30 font-light text-[#1a1c1c]">
              {measurements.map((row) => (
                <tr key={row.size} className="hover:bg-[#f9f9f9]">
                  <td className="py-3 px-2 font-semibold text-black">{row.size}</td>
                  <td className="py-3 px-2">{row.chest}</td>
                  <td className="py-3 px-2">{row.shoulder}</td>
                  <td className="py-3 px-2">{row.length}</td>
                  <td className="py-3 px-2">{row.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-[#cfc4c5]/20 text-[11px] text-[#5d5f5f] flex justify-between items-center">
          <p>Need custom tailoring advice? Contact our digital atelier.</p>
          <button onClick={onClose} className="bg-black text-white px-5 py-2 text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
