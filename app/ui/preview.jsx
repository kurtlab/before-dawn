'use strict'

var React = require('react');

module.exports = React.createClass({
  render: function() {
    var s = this.props.saver;
    var url_opts = this.props.url_opts;
    var saver_opts = this.props.saver_opts;
    var mergedOpts;

    console.log("PREVIEW", s);
    mergedOpts = _.merge(url_opts, s.settings);
    
    mergedOpts = _.merge(mergedOpts, saver_opts);
    var previewUrl = s.getPreviewUrl(mergedOpts);

    return (
      <div>
        <iframe scrolling='no' className='mini' src={previewUrl} />
      </div>
    );
  }
});
