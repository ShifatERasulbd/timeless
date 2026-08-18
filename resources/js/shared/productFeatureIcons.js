import {
    BadgeCheck,
    Droplets,
    Feather,
    Leaf,
    ShieldCheck,
    Sparkles,
    StretchHorizontal,
    Sun,
    ThermometerSun,
    Wind,
} from 'lucide-react';

const icons = {
    'badge-check': BadgeCheck,
    droplets: Droplets,
    feather: Feather,
    leaf: Leaf,
    'shield-check': ShieldCheck,
    sparkles: Sparkles,
    stretch: StretchHorizontal,
    sun: Sun,
    temperature: ThermometerSun,
    wind: Wind,
};

export const productFeatureIconOptions = [
    { value: 'sparkles', label: 'Premium' },
    { value: 'badge-check', label: 'Quality' },
    { value: 'shield-check', label: 'Protection' },
    { value: 'droplets', label: 'Moisture Resistant' },
    { value: 'wind', label: 'Breathable' },
    { value: 'stretch', label: 'Stretch' },
    { value: 'feather', label: 'Lightweight' },
    { value: 'leaf', label: 'Sustainable' },
    { value: 'sun', label: 'UV Protection' },
    { value: 'temperature', label: 'Temperature Control' },
];

export function resolveProductFeatureIcon(iconName) {
    return icons[iconName] || Sparkles;
}