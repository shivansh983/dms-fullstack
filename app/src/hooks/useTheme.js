import { useUiStore } from '../store/uiStore';
import { lightColors, darkColors } from '../styles/theme';

export default function useTheme()
{
    const mode = useUiStore((s)=> s.mode);
    const toggleTheme = useUiStore((s) => s.toggleTheme);


return {
    colors: mode === 'dark' ? darkColors : lightColors,
    isDark: mode === 'dark',
    toggleTheme,
}
}