import {Tag, TagLabel, TagCloseButton} from '@chakra-ui/react';
/**
 * Represents an email added to the list. Highlighted with a close button for removal.
 */
export const Chip = ({ email, onCloseClick }) => (
    <Tag key={email} borderRadius="full" variant="solid" colorScheme="green">
      <TagLabel>{email}</TagLabel>
      <TagCloseButton
        onClick={() => {
          onCloseClick(email)
        }}
      />
    </Tag>
  );