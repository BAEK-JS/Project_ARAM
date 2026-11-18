import { createContext, ReactNode, useContext } from 'react';

import { Gender, Palette, palettes } from './theme';

const PaletteContext = createContext<Palette>(palettes.unknown);

export function PaletteProvider({ gender, children }: { gender?: Gender; children: ReactNode }) {
  return <PaletteContext.Provider value={palettes[gender ?? 'unknown']}>{children}</PaletteContext.Provider>;
}

export function usePalette(): Palette {
  return useContext(PaletteContext);
}
