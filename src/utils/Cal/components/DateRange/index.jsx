import React, { Component } from "react";
import PropTypes from "prop-types";
import Calendar from "../Calendar";
import { rangeShape } from "../DayCell";
import { findNextRangeIndex, generateStyles } from "../../utils";
import {
  isBefore,
  differenceInCalendarDays,
  addDays,
  min,
  isWithinInterval,
  max,
} from "date-fns";
import classnames from "classnames";
import coreStyles from "../../styles";

class DateRange extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      focusedRange: props.initialFocusedRange || [
        findNextRangeIndex(props.ranges),
        0,
      ],
      preview: null,
    };
    this.styles = generateStyles([coreStyles, props.classNames]);
  }
  calcNewSelection = (value, isSingleValue = true) => {
    const focusedRange = this.props.focusedRange || this.state.focusedRange;
    const { ranges, onChange, disabledDates } = this.props;
    const focusedRangeIndex = focusedRange[0];
    const selectedRange = ranges[focusedRangeIndex];
    if (!selectedRange || !onChange) return {};
    let { startDate, endDate } = selectedRange;
    let nextFocusRange;

    if (!isSingleValue) {
      startDate = value.startDate;
      endDate = value.endDate;
    } else if (focusedRange[1] === 0) {
      // startDate selection
      startDate = value;
      endDate = null; // Set endDate to null when selecting startDate
      nextFocusRange = [focusedRange[0], 1];
    } else {
      // endDate selection
      endDate = value;
    }

    // Only check and swap dates if both are set
    if (endDate && startDate && isBefore(endDate, startDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const inValidDatesWithinRange = endDate
      ? disabledDates.filter((disabledDate) =>
          isWithinInterval(disabledDate, {
            start: startDate,
            end: endDate,
          })
        )
      : [];

    if (inValidDatesWithinRange.length > 0) {
      if (focusedRange[1] === 0) {
        startDate = addDays(max(inValidDatesWithinRange), 1);
      } else {
        endDate = addDays(min(inValidDatesWithinRange), -1);
      }
    }

    if (!nextFocusRange) {
      const nextFocusRangeIndex = findNextRangeIndex(
        this.props.ranges,
        focusedRange[0]
      );
      nextFocusRange = [nextFocusRangeIndex, 0];
    }

    return {
      wasValid: !(inValidDatesWithinRange.length > 0),
      range: { startDate, endDate },
      nextFocusRange: nextFocusRange,
    };
  };
  setSelection = (value, isSingleValue) => {
    const { onChange, ranges, onRangeFocusChange } = this.props;
    const focusedRange = this.props.focusedRange || this.state.focusedRange;
    const focusedRangeIndex = focusedRange[0];
    const selectedRange = ranges[focusedRangeIndex];
    if (!selectedRange) return;
    const newSelection = this.calcNewSelection(value, isSingleValue);
    onChange({
      [selectedRange.key || `range${focusedRangeIndex + 1}`]: {
        ...selectedRange,
        ...newSelection.range,
      },
    });
    this.setState({
      focusedRange: newSelection.nextFocusRange,
      preview: null,
    });
    onRangeFocusChange && onRangeFocusChange(newSelection.nextFocusRange);

    // Update preview for both single date and range selections
    this.updatePreview({ range: newSelection.range });
  };
  handleRangeFocusChange = (focusedRange) => {
    this.setState({ focusedRange });
    this.props.onRangeFocusChange &&
      this.props.onRangeFocusChange(focusedRange);
  };
  updatePreview = (val) => {
    if (!val) {
      this.setState({ preview: null });
      return;
    }
    const { rangeColors, ranges } = this.props;
    const focusedRange = this.props.focusedRange || this.state.focusedRange;
    const color =
      ranges[focusedRange[0]]?.color || rangeColors[focusedRange[0]] || color;

    if (val.range.startDate && val.range.endDate) {
      // Both dates selected - show full range
      this.setState({ preview: { ...val.range, color } });
    } else if (val.range.startDate) {
      // Only start date selected - highlight just that day
      this.setState({
        preview: {
          startDate: val.range.startDate,
          endDate: val.range.startDate,
          color,
        },
      });
    } else {
      this.setState({ preview: null });
    }
  };

  render() {
    const { ranges } = this.props;
    const focusedRange = this.props.focusedRange || this.state.focusedRange;
    const focusedRangeIndex = focusedRange[0];
    const selectedRange = ranges[focusedRangeIndex];

    // Create a range to pass, even if it's just a start date
    const rangeToPass =
      selectedRange && selectedRange.startDate
        ? {
            ...selectedRange,
            endDate: selectedRange.endDate || selectedRange.startDate,
          }
        : null;

    return (
      <Calendar
        focusedRange={this.state.focusedRange}
        onRangeFocusChange={this.handleRangeFocusChange}
        preview={this.state.preview}
        onPreviewChange={(value) => {
          this.updatePreview(value ? this.calcNewSelection(value) : null);
        }}
        {...this.props}
        ranges={rangeToPass ? [rangeToPass] : []}
        displayMode="dateRange"
        className={classnames(
          this.styles.dateRangeWrapper,
          this.props.className
        )}
        onChange={this.setSelection}
        updateRange={(val) => this.setSelection(val, false)}
        ref={(target) => {
          this.calendar = target;
        }}
      />
    );
  }
}

DateRange.defaultProps = {
  classNames: {},
  ranges: [],
  moveRangeOnFirstSelection: false,
  retainEndDateOnFirstSelection: false,
  rangeColors: ["#3d91ff", "#3ecf8e", "#fed14c"],
  disabledDates: [],
};

DateRange.propTypes = {
  ...Calendar.propTypes,
  onChange: PropTypes.func,
  onRangeFocusChange: PropTypes.func,
  className: PropTypes.string,
  ranges: PropTypes.arrayOf(rangeShape),
  moveRangeOnFirstSelection: PropTypes.bool,
  retainEndDateOnFirstSelection: PropTypes.bool,
};

export default DateRange;
