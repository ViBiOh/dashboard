/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import React from 'react';
import { shallow } from 'enzyme';
import ContainerNetwork from './ContainerNetwork';

describe('ContainerNetwork', () => {
  let wrapper;
  const container = {
    NetworkSettings: {},
  };

  beforeEach(() => {
    wrapper = shallow(<ContainerNetwork container={container} />);
  });

  it('should always render as a span', () => {
    expect(wrapper.type()).to.equal('span');
  });

  it('should not render Networks if empty', () => {
    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Networks').length).to.equal(0);
  });

  it('should render Networks if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Networks: {
            bridge: {
              IPAddress: '8.8.8.8',
            },
            loop: {
              IPAddress: '127.0.0.1',
            },
          },
        },
      },
    });

    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Networks').length).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^bridge\s*\|\s*8.8.8.8$/.test(n.text())).length,
    ).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^loop\s*\|\s*127.0.0.1$/.test(n.text())).length,
    ).to.equal(1);
  });

  it('should not render Links if empty', () => {
    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Links').length).to.equal(0);
  });

  it('should render Links if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Networks: {
            bridge: {
              Links: ['mysql:db'],
            },
          },
        },
      },
    });

    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Links').length).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^mysql\s*\|\s*db$/.test(n.text())).length,
    ).to.equal(2);
  });

  it('should not render Ports if empty', () => {
    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Ports').length).to.equal(0);
  });

  it('should render Ports if present', () => {
    wrapper.setProps({
      container: {
        ...container,
        NetworkSettings: {
          ...container.NetworkSettings,
          Ports: {
            8080: [{
              HostPort: '80',
            }, {
              HostPort: '443',
            }],
          },
        },
      },
    });

    expect(wrapper.find('h3').filterWhere(n => n.text() === 'Ports').length).to.equal(1);
    expect(
      wrapper.find('span').filterWhere(n => /^8080\s*\|\s*80, 443$/.test(n.text())).length,
    ).to.equal(2);
  });
});
