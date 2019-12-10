import React from 'react';
import { act } from 'react-dom/test-utils';
import { createMemoryHistory } from 'history';
import { mountWithContexts, waitForElement } from '@testUtils/enzymeHelpers';
import OrganizationAdd from './OrganizationAdd';
import { OrganizationsAPI } from '@api';

jest.mock('@api');

describe('<OrganizationAdd />', () => {
  test('handleSubmit should post to api', async () => {
    const updatedOrgData = {
      name: 'new name',
      description: 'new description',
      custom_virtualenv: 'Buzz',
    };
    await act(async () => {
      const wrapper = mountWithContexts(<OrganizationAdd />);
      wrapper.find('OrganizationForm').prop('handleSubmit')(
        updatedOrgData,
        [],
        []
      );
    });
    expect(OrganizationsAPI.create).toHaveBeenCalledWith(updatedOrgData);
  });

  test('should navigate to organizations list when cancel is clicked', async () => {
    const history = createMemoryHistory({});
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />, {
        context: { router: { history } },
      });
      wrapper.find('button[aria-label="Cancel"]').invoke('onClick')();
    });
    expect(history.location.pathname).toEqual('/organizations');
  });

  test('should navigate to organizations list when close (x) is clicked', async () => {
    const history = createMemoryHistory({});
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />, {
        context: { router: { history } },
      });
      wrapper.find('button[aria-label="Close"]').invoke('onClick')();
    });
    expect(history.location.pathname).toEqual('/organizations');
  });

  test('successful form submission should trigger redirect', async () => {
    const history = createMemoryHistory({});
    const orgData = {
      name: 'new name',
      description: 'new description',
      custom_virtualenv: 'Buzz',
    };
    OrganizationsAPI.create.mockResolvedValueOnce({
      data: {
        id: 5,
        related: {
          instance_groups: '/bar',
        },
        ...orgData,
      },
    });
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />, {
        context: { router: { history } },
      });
      await waitForElement(wrapper, 'button[aria-label="Save"]');
      await wrapper.find('OrganizationForm').prop('handleSubmit')(
        orgData,
        [3],
        []
      );
    });
    expect(history.location.pathname).toEqual('/organizations/5');
  });

  test('handleSubmit should post instance groups', async () => {
    const orgData = {
      name: 'new name',
      description: 'new description',
      custom_virtualenv: 'Buzz',
    };
    OrganizationsAPI.create.mockResolvedValueOnce({
      data: {
        id: 5,
        related: {
          instance_groups: '/api/v2/organizations/5/instance_groups',
        },
        ...orgData,
      },
    });
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />);
    });
    await waitForElement(wrapper, 'button[aria-label="Save"]');
    await wrapper.find('OrganizationForm').prop('handleSubmit')(
      orgData,
      [3],
      []
    );
    expect(OrganizationsAPI.associateInstanceGroup).toHaveBeenCalledWith(5, 3);
  });

  test('AnsibleSelect component renders if there are virtual environments', async () => {
    const config = {
      custom_virtualenvs: ['foo', 'bar'],
    };
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />, {
        context: { config },
      }).find('AnsibleSelect');
    });
    expect(wrapper.find('FormSelect')).toHaveLength(1);
    expect(wrapper.find('FormSelectOption')).toHaveLength(3);
    expect(
      wrapper
        .find('FormSelectOption')
        .first()
        .prop('value')
    ).toEqual('/venv/ansible/');
  });

  test('AnsibleSelect component does not render if there are 0 virtual environments', async () => {
    const config = {
      custom_virtualenvs: [],
    };
    let wrapper;
    await act(async () => {
      wrapper = mountWithContexts(<OrganizationAdd />, {
        context: { config },
      }).find('AnsibleSelect');
    });
    expect(wrapper.find('FormSelect')).toHaveLength(0);
  });
});
