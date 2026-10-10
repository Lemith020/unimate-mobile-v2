import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '../../../../contexts/PreferencesContext';

// Keep this component in its current folder. @ must point to your project root.
// Pass onNotificationsPress from the parent when that page is ready.
export default function PrefsSection({ onNotificationsPress }) {
    const { theme, language, colors, setTheme, setLanguage, t, saveError } = usePreferences();
    const [showLanguages, setShowLanguages] = useState(false);

    return (
        <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
                <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{t('appearance')}</Text>
            </View>

            <View style={[styles.segmentedControl, { backgroundColor: colors.track }]}>
                {['light', 'dark'].map((mode) => {
                    const selected = theme === mode;
                    return (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.segmentButton, selected && { backgroundColor: colors.accent }]}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => setTheme(mode)}
                        >
                            <Ionicons name={mode === 'light' ? 'sunny-outline' : 'moon-outline'} size={18} color={selected ? colors.onAccent : colors.muted} />
                            <Text style={[styles.segmentText, { color: selected ? colors.onAccent : colors.muted }]}>{t(mode)}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity style={styles.row} activeOpacity={0.7} accessibilityRole="button" onPress={() => setShowLanguages(true)}>
                <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="globe-outline" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{t('language')}</Text>
                <Text style={[styles.badge, { color: colors.accent, backgroundColor: colors.accentSoft }]}>{language === 'en' ? 'English' : 'සිංහල'}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} activeOpacity={0.7} accessibilityRole="button" disabled={!onNotificationsPress} accessibilityState={{ disabled: !onNotificationsPress }} onPress={onNotificationsPress}>
                <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="notifications-outline" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.label, { color: colors.text }]}>{t('notifications')}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
            {saveError && <Text style={styles.error} accessibilityLiveRegion="polite">{t('storageError')}</Text>}

            <Modal visible={showLanguages} transparent animationType="fade" onRequestClose={() => setShowLanguages(false)}>
                <View style={styles.overlay}>
                    <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('cancel')} onPress={() => setShowLanguages(false)} />
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]} accessibilityViewIsModal>
                        <View style={[styles.modalIcon, { backgroundColor: colors.accentSoft }]}>
                            <Ionicons name="language-outline" size={28} color={colors.accent} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('chooseLanguage')}</Text>
                        <Text style={[styles.modalHint, { color: colors.muted }]}>{t('hint')}</Text>
                        {[{ code: 'en', title: 'English', subtitle: 'English' }, { code: 'si', title: 'සිංහල', subtitle: 'Sinhala' }].map((item) => {
                            const selected = language === item.code;
                            return (
                                <TouchableOpacity
                                    key={item.code}
                                    style={[styles.languageOption, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accentSoft : colors.surface }]}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    onPress={() => { setLanguage(item.code); setShowLanguages(false); }}
                                >
                                    <View style={styles.languageText}>
                                        <Text style={[styles.languageTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.languageSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
                                    </View>
                                    <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.accent : colors.muted} />
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity style={styles.cancelButton} accessibilityRole="button" onPress={() => setShowLanguages(false)}>
                            <Text style={[styles.cancelText, { color: colors.muted }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: { marginTop: 6, paddingHorizontal: 4, borderRadius: 16, paddingBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, minHeight: 52 },
    iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    label: { flex: 1, fontSize: 14, fontWeight: '500' },
    badge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 8 },
    segmentedControl: { flexDirection: 'row', borderRadius: 12, marginHorizontal: 16, marginBottom: 10, padding: 4, gap: 4 },
    segmentButton: { flex: 1, flexDirection: 'row', gap: 8, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 9 },
    segmentText: { fontSize: 13, fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { width: '100%', maxWidth: 380, padding: 24, borderRadius: 24 },
    modalIcon: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    modalHint: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    languageOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 },
    languageText: { flex: 1 },
    languageTitle: { fontSize: 16, fontWeight: '600' },
    languageSubtitle: { fontSize: 12, marginTop: 4 },
    cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: 4 },
    cancelText: { fontSize: 14, fontWeight: '600' },
    error: { fontSize: 12, color: '#EF4444', lineHeight: 18, paddingHorizontal: 16, paddingVertical: 8 },
});
