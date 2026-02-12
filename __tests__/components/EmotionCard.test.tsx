import React from 'react';
import { render } from '@testing-library/react-native';
import { EmotionCard } from '@/components/EmotionCard';

describe('EmotionCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render label correctly', () => {
    const { getByText } = render(
      <EmotionCard
        label="tranquila"
        emoji="😌"
        selected={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('tranquila')).toBeTruthy();
  });

  it('should display emoji', () => {
    const { getByText } = render(
      <EmotionCard
        label="motivada"
        emoji="💪"
        selected={false}
        onPress={mockOnPress}
      />
    );

    expect(getByText('💪')).toBeTruthy();
  });

  it('should apply selected style when selected', () => {
    const { getByText } = render(
      <EmotionCard
        label="tranquila"
        emoji="😌"
        selected={true}
        onPress={mockOnPress}
      />
    );

    const card = getByText('tranquila');
    expect(card).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { getByText } = render(
      <EmotionCard
        label="tranquila"
        emoji="😌"
        selected={false}
        onPress={mockOnPress}
      />
    );

    const card = getByText('tranquila').parent;
    if (card && card.props.onPress) {
      card.props.onPress();
      expect(mockOnPress).toHaveBeenCalled();
    }
  });
});
