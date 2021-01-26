/* eslint-disable no-use-before-define */

// Based on Material UI Creatable example: https://material-ui.com/components/autocomplete/#creatable

import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import PropTypes from "prop-types";

const filter = createFilterOptions();

export function ComboBox({label, options, current, allowUserInput, onChange, style}) {
  const currentOption = ((current >= 0) && (current < options.length)) ? options[current] : '';
  const [value, setValue] = React.useState(currentOption);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        let newSelection = newValue;
        if (typeof newValue === 'string') {
          setValue({
            title: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          // Create a new value from the user input
          setValue({
            title: newValue.inputValue,
          });
          newSelection = newValue.inputValue;
        } else {
          setValue(newValue);
          newSelection = newValue?.title;
        }
        const index = options.findIndex(option => (option.title === newSelection));
        onChange && onChange(newSelection, index);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        // Suggest the creation of a new value
        if (params.inputValue !== '') {
          filtered.push({
            inputValue: params.inputValue,
            title: `Add "${params.inputValue}"`,
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="settings-combo-box"
      options={options}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
        }
        // Regular option
        return option.title;
      }}
      renderOption={(option) => option.title}
      style={style || {marginTop: '16px', width: '500px'}}
      freeSolo={!!allowUserInput}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
    />
  );
}

// {, , , allowUserInput, }
ComboBox.propTypes = {
  /** array of choices to show in dropdown. To give flexibility in data sources, each item is an object and only the title member is required to show the user */
  options: PropTypes.array.isRequired,
  /** The Prompt */
  label: PropTypes.string.isRequired,
  /** callback function when a new selection is made */
  onChange: PropTypes.func,
  /** index of current selection (optional - default is no selection) */
  current: PropTypes.number,
  /** if true then the user can type in anything and add as selection (optional - default is false) */
  allowUserInput: PropTypes.bool,
  /** style to use for comboBox (optionaL) */
  style: PropTypes.object,
}

export default ComboBox
