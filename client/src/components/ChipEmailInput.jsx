import {Box, Input} from '@chakra-ui/react';

/**
 * Form field wrapper.
 */
export const ChipEmailInput = ({ ...rest }) => (
    <Box>
      <Input type="email" {...rest} />
    </Box>
  );