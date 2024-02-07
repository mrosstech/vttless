import {Wrap} from '@chakra-ui/react';
import {Chip} from './Chip';
/**
 * A horizontal stack of chips. Like a Pringles can on its side.
 */
export const ChipList = ({ emails = [], onCloseClick }) => (
    <Wrap spacing={1} mb={3}>
      {emails.map((email) => (
        <Chip email={email} key={email} onCloseClick={onCloseClick} />
      ))}
    </Wrap>
  );