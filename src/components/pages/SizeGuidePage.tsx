import React, { useState } from 'react';
import { ViewScreen } from '../../types';
import { BodyText, InfoPageShell, SectionHeading } from './InfoPageShell';

interface SizeGuidePageProps {
  onNavigate: (screen: ViewScreen, category?: string) => void;
}

type Unit = 'inches' | 'cm';

const tshirts = {
  inches: [
    { size: 'S', chest: '36–38"', length: '27"', shoulder: '16.5"', sleeve: '8"' },
    { size: 'M', chest: '38–40"', length: '28"', shoulder: '17.5"', sleeve: '8.5"' },
    { size: 'L', chest: '41–43"', length: '29"', shoulder: '18.5"', sleeve: '9"' },
    { size: 'XL', chest: '44–46"', length: '30"', shoulder: '19.5"', sleeve: '9.5"' },
    { size: 'XXL', chest: '47–49"', length: '31"', shoulder: '20.5"', sleeve: '10"' },
  ],
  cm: [
    { size: 'S', chest: '91–96', length: '69', shoulder: '42', sleeve: '20' },
    { size: 'M', chest: '97–102', length: '71', shoulder: '44.5', sleeve: '21.5' },
    { size: 'L', chest: '104–109', length: '74', shoulder: '47', sleeve: '23' },
    { size: 'XL', chest: '112–117', length: '76', shoulder: '49.5', sleeve: '24' },
    { size: 'XXL', chest: '119–124', length: '79', shoulder: '52', sleeve: '25.5' },
  ],
};

const shirts = {
  inches: [
    { size: 'S', chest: '38–40"', waist: '32–34"', shoulder: '17"', sleeve: '33.5"' },
    { size: 'M', chest: '40–42"', waist: '34–36"', shoulder: '18"', sleeve: '34.5"' },
    { size: 'L', chest: '42–44"', waist: '36–38"', shoulder: '19"', sleeve: '35.5"' },
    { size: 'XL', chest: '44–46"', waist: '38–40"', shoulder: '20"', sleeve: '36.5"' },
    { size: 'XXL', chest: '46–48"', waist: '40–42"', shoulder: '21"', sleeve: '37.5"' },
  ],
  cm: [
    { size: 'S', chest: '97–102', waist: '81–86', shoulder: '43', sleeve: '85' },
    { size: 'M', chest: '102–107', waist: '86–91', shoulder: '46', sleeve: '87.5' },
    { size: 'L', chest: '107–112', waist: '91–97', shoulder: '48', sleeve: '90' },
    { size: 'XL', chest: '112–117', waist: '97–102', shoulder: '51', sleeve: '92.5' },
    { size: 'XXL', chest: '117–122', waist: '102–107', shoulder: '53', sleeve: '95' },
  ],
};

const jeans = {
  inches: [
    { size: 'S', waist: '30"', hip: '38"', inseam: '30"' },
    { size: 'M', waist: '32"', hip: '40"', inseam: '31"' },
    { size: 'L', waist: '34"', hip: '42"', inseam: '32"' },
    { size: 'XL', waist: '36"', hip: '44"', inseam: '32"' },
    { size: 'XXL', waist: '38"', hip: '46"', inseam: '32"' },
  ],
  cm: [
    { size: 'S', waist: '76', hip: '97', inseam: '76' },
    { size: 'M', waist: '81', hip: '102', inseam: '79' },
    { size: 'L', waist: '86', hip: '107', inseam: '81' },
    { size: 'XL', waist: '91', hip: '112', inseam: '81' },
    { size: 'XXL', waist: '97', hip: '117', inseam: '81' },
  ],
};

const cargos = {
  inches: [
    { size: 'S', waist: '30"', hip: '40"', length: '40"' },
    { size: 'M', waist: '32"', hip: '42"', length: '41"' },
    { size: 'L', waist: '34"', hip: '44"', length: '42"' },
    { size: 'XL', waist: '36"', hip: '46"', length: '42.5"' },
    { size: 'XXL', waist: '38"', hip: '48"', length: '43"' },
  ],
  cm: [
    { size: 'S', waist: '76', hip: '102', length: '102' },
    { size: 'M', waist: '81', hip: '107', length: '104' },
    { size: 'L', waist: '86', hip: '112', length: '107' },
    { size: 'XL', waist: '91', hip: '117', length: '108' },
    { size: 'XXL', waist: '97', hip: '122', length: '109' },
  ],
};

function Chart({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Record<string, string>[];
}) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-4">{title}</h3>
      <div className="overflow-x-auto border border-[#cfc4c5]/30 bg-white">
        <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[420px]">
          <thead>
            <tr className="border-b border-black text-black uppercase tracking-wider font-semibold">
              {headers.map((h) => (
                <th key={h} className="py-3 px-3 sm:px-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#cfc4c5]/30 font-light text-[#1a1c1c]">
            {rows.map((row) => (
              <tr key={row.size} className="hover:bg-[#f9f9f9]">
                {headers.map((h) => {
                  const key = h.toLowerCase();
                  return (
                    <td key={h} className={`py-3 px-3 sm:px-4 ${h === 'Size' ? 'font-semibold text-black' : ''}`}>
                      {row[key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const SizeGuidePage: React.FC<SizeGuidePageProps> = ({ onNavigate }) => {
  const [unit, setUnit] = useState<Unit>('inches');
  const suffix = unit === 'cm' ? ' (cm)' : '';

  return (
    <InfoPageShell
      eyebrow="Support"
      title="FIND YOUR PERFECT FIT"
      intro="Measure against your body, then compare with our finished-garment charts. If you fall between sizes, we recommend the larger size for ease of movement."
      onNavigate={onNavigate}
    >
      <div className="max-w-4xl space-y-12">
        <section>
          <SectionHeading>How to measure</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Chest',
                text: 'Measure around the fullest part of your chest, keeping the tape level under the arms and across the shoulder blades.',
              },
              {
                title: 'Waist',
                text: 'Measure around your natural waistline, typically the narrowest point above the hips. Keep the tape snug, not tight.',
              },
              {
                title: 'Hip',
                text: 'Stand with feet together and measure around the fullest part of the hips and seat.',
              },
              {
                title: 'Shoulder',
                text: 'Measure from the edge of one shoulder to the other, following the natural line across the back.',
              },
              {
                title: 'Sleeve',
                text: 'With your arm slightly bent, measure from the shoulder point down to the wrist bone.',
              },
            ].map((item) => (
              <div key={item.title} className="border border-[#cfc4c5]/30 bg-white p-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-black mb-3">{item.title}</h3>
                <BodyText>{item.text}</BodyText>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <div className="border border-[#cfc4c5] p-0.5 flex text-xs uppercase tracking-wider font-semibold">
            <button
              type="button"
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                unit === 'inches' ? 'bg-black text-white' : 'text-[#5d5f5f] hover:text-black'
              }`}
            >
              Inches
            </button>
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 transition-colors cursor-pointer ${
                unit === 'cm' ? 'bg-black text-white' : 'text-[#5d5f5f] hover:text-black'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        <Chart
          title={`T-Shirts${suffix}`}
          headers={['Size', 'Chest', 'Length', 'Shoulder', 'Sleeve']}
          rows={tshirts[unit]}
        />
        <Chart
          title={`Shirts${suffix}`}
          headers={['Size', 'Chest', 'Waist', 'Shoulder', 'Sleeve']}
          rows={shirts[unit]}
        />
        <Chart
          title={`Jeans${suffix}`}
          headers={['Size', 'Waist', 'Hip', 'Inseam']}
          rows={jeans[unit]}
        />
        <Chart
          title={`Cargos / Bottomwear${suffix}`}
          headers={['Size', 'Waist', 'Hip', 'Length']}
          rows={cargos[unit]}
        />

        <BodyText>
          Charts reflect typical finished garment measurements. For tailored outerwear, open the size guide on the
          product page for architectural blazer dimensions. Still unsure?{' '}
          <button
            type="button"
            onClick={() => onNavigate('contact')}
            className="text-black underline hover:opacity-70 cursor-pointer"
          >
            Contact our atelier
          </button>
          .
        </BodyText>
      </div>
    </InfoPageShell>
  );
};
