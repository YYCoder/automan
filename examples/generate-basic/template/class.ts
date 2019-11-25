import React from 'react';
import './style.less';

export default class <%= name %> extends React.Component {
    render() {
        return (
            <div className="<%= name %>"><%= name %></div>
        )
    }
}