import React from 'react';
import { Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native';
import { C, F } from '../theme';
import { Tap } from './ui';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 460,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <RNModal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(6,6,8,0.72)', alignItems: 'center', justifyContent: 'center', padding: 18 }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%',
            maxWidth,
            maxHeight: '82%',
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            backgroundColor: '#0c0c0f',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{ flex: 1, fontFamily: F.d800, fontSize: 17, color: '#f3f3f3' }}>{title}</Text>
            <Tap
              kind="light"
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#9a9a9a', fontSize: 18, lineHeight: 20 }}>×</Text>
            </Tap>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
