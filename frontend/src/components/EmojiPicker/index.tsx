import { useState } from 'react';
import styles from './EmojiPicker.module.css';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
  '🙌', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '⭐'
];

const EmojiPicker = ({ onEmojiSelect, isOpen = true, onClose }: EmojiPickerProps) => {
  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <span>Choose emoji</span>
        {onClose && (
          <button type="button" onClick={onClose} className={styles.closeButton}>×</button>
        )}
      </div>
      <div className={styles.emojiGrid}>
        {emojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className={styles.emojiButton}
            onClick={() => {
              onEmojiSelect(emoji);
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker; 