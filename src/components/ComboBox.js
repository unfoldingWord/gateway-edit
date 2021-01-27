/* eslint-disable no-use-before-define */

// Based on Material UI Creatable example: https://material-ui.com/components/autocomplete/#creatable
//    and https://material-ui.com/components/autocomplete/#checkboxes

import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import IconButton from '@material-ui/core/IconButton';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from "prop-types";

const filter = createFilterOptions();

export function ComboBox({label, options: options_, current, allowUserInput, onChange, deleteItem, style}) {
  const currentOption = ((current >= 0) && (current < options_.length)) ? options_[current] : '';
  const [value, setValue] = React.useState(currentOption);
  const [options, setOptions] = React.useState(options_);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        let newSelection = newValue;
        if (typeof newValue === 'string') {
          console.log(`ComboBox.onChange() - string, current: ${value.title}, newValue: ${newValue}`)
          setValue({
            title: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          console.log(`ComboBox.onChange() - current: ${value.title}, newValue.inputValue: ${newValue.inputValue}`)
         // Create a new value from the user input
          setValue({
            title: newValue.inputValue,
          });
          newSelection = newValue.inputValue;
        } else if (newValue === null) {
          console.log(`ComboBox.onChange() - null current: ${value.title}, newValue: ${JSON.stringify(newValue)}`)
          return;
        } else if (newValue.deleting) {
          console.log(`ComboBox.onChange() - deleting - current: ${value.title}, newValue: ${JSON.stringify(newValue)}`)
          return;
        } else {
          console.log(`ComboBox.onChange() - not null, current: ${value.title}, newValue: ${JSON.stringify(newValue)}`)
          setValue(newValue);
          newSelection = newValue?.title;
        }
        const index = options.findIndex(option => (option.title === newSelection));
        console.log(`ComboBox.onChange() - newSelection: ${newSelection}, index: ${index}`)
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
      renderOption={(option) => (
        <React.Fragment>
          {option.title}
          {option.userAdded &&
          <Tooltip title="Remove">
            <IconButton aria-label="delete" onClick={() => {
              const currentTitle = value.title;
              const removeTitle = option.title;
              console.log(`ComboBox.delete() - currentTitle: ${currentTitle}, removeTitle: ${removeTitle}`)
              deleteItem(removeTitle);
              const index = options.findIndex(item => (item.title === removeTitle));
              if (index >= 0) {
                console.log(`ComboBox.delete() - index: ${index}`)
                options[index].deleting = true; // flag we are deleting before onChange called
                options.splice(index, 1);
                setOptions(options);

                if (currentTitle === removeTitle) { // if we removed current
                  console.log(`ComboBox.delete() - removing current`)
                  const newIndex = 0;
                  const newSelection = options[newIndex];
                  setValue(newSelection);
                  console.log(`ComboBox.delete() - newSelection: ${newSelection}`)
                  onChange && onChange(newSelection.title, newIndex);
                } else { // reselect current item since race condition can level wrong item selected
                  const newSelection = options[index];
                  setValue(newSelection);
                }
              }
            }} >
              <HighlightOffIcon/>
            </IconButton>
          </Tooltip>
          }
        </React.Fragment>
      )}
      style={style || {marginTop: '16px', width: '500px'}}
      freeSolo={!!allowUserInput}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
    />
  );
};

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
