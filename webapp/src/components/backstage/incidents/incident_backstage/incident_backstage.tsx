// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import styled, {css} from 'styled-components';
import {Redirect, useRouteMatch} from 'react-router-dom';

import {GlobalState} from 'mattermost-redux/types/store';
import {Team} from 'mattermost-redux/types/teams';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import {Incident, Metadata as IncidentMetadata} from 'src/types/incident';
import {IncidentBackstageTabState} from 'src/types/backstage';
import {Overview} from 'src/components/backstage/incidents/incident_backstage/overview/overview';
import {fetchIncident, fetchIncidentMetadata} from 'src/client';
import {navigateToTeamPluginUrl, navigateToUrl, teamPluginErrorUrl} from 'src/browser_routing';
import {ErrorPageTypes} from 'src/constants';
import {
    Badge,
    SecondaryButtonLargerRight,
} from 'src/components/backstage/incidents/shared';

const Container = styled.div`
    padding: 20px;
    max-width: 1120px;
    margin: 0 auto;
    //border: 1px solid black;
    font-family: 'Open Sans', sans-serif;
    font-style: normal;
    font-weight: 600;
`;

const TopRow = styled.div`
    display: flex;
    align-items: center;
    //border: 1px solid blue;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    margin: 20px 0 0 0;
    //border: 1px solid green;
`;

const LeftArrow = styled.button`
    display: block;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 32px;
    line-height: 32px;
    cursor: pointer;
    color: var(--center-channel-color-56);

    &:hover {
        background: var(--button-bg-08);
        color: var(--button-bg);
    }
`;

const Title = styled.div`
    font-size: 20px;
    padding: 0 15px 0 0;
    color: var(--center-channel-color);
`;

interface TabItemProps {
    active: boolean;
}

const TabItem = styled.div<TabItemProps>`
    line-height: 32px;
    padding: 0 20px;
    margin: 0 20px;
    font-size: 14px;
    cursor: pointer;

    box-shadow: inset 0px -2px 0px var(--center-channel-color-16);
    ${(props) => props.active && css`
        box-shadow: inset 0px -2px 0px var(--button-bg);
        color: var(--button-bg);
    `}
`;

interface MatchParams {
    incidentId: string
}

const FetchingStateType = {
    loading: 'loading',
    fetched: 'fetched',
    notFound: 'notfound',
};

const IncidentBackstage = () => {
    const [tabState, setTabState] = useState(IncidentBackstageTabState.ViewingOverview);
    const [incident, setIncident] = useState<Incident | null>(null);
    const [incidentMetadata, setIncidentMetadata] = useState<IncidentMetadata | null>(null);
    const currentTeam = useSelector<GlobalState, Team>(getCurrentTeam);

    const match = useRouteMatch<MatchParams>();

    const [fetchingState, setFetchingState] = useState(FetchingStateType.loading);

    useEffect(() => {
        const incidentId = match.params.incidentId;

        Promise.all([fetchIncident(incidentId), fetchIncidentMetadata(incidentId)]).then(([incidentResult, incidentMetadataResult]) => {
            setIncident(incidentResult);
            setIncidentMetadata(incidentMetadataResult);
            setFetchingState(FetchingStateType.fetched);
        }).catch(() => {
            setFetchingState(FetchingStateType.notFound);
        });
    }, [match.params.incidentId]);

    if (fetchingState === FetchingStateType.loading) {
        return null;
    }

    if (fetchingState === FetchingStateType.notFound || incident === null || incidentMetadata === null) {
        return <Redirect to={teamPluginErrorUrl(currentTeam.name, ErrorPageTypes.INCIDENTS)}/>;
    }

    const goToChannel = () => {
        navigateToUrl(`/${incidentMetadata.team_name}/channels/${incidentMetadata.channel_name}`);
    };

    const closeIncidentDetails = () => {
        navigateToTeamPluginUrl(currentTeam.name, '/incidents');
    };

    const tabPage = <Overview incident={incident}/>;

    return (
        <Container>
            <TopRow>
                <LeftArrow
                    className='icon-chevron-left'
                    onClick={closeIncidentDetails}
                />
                <Title data-testid='incident-title'>{incident.name}</Title>
                <Badge status={incident.current_status}/>
                <SecondaryButtonLargerRight onClick={goToChannel}>
                    <i className='icon-mattermost'/>
                    {'Mattermost Channel'}
                </SecondaryButtonLargerRight>
            </TopRow>
            <Row>
                <TabItem
                    active={tabState === IncidentBackstageTabState.ViewingOverview}
                    onClick={() => setTabState(IncidentBackstageTabState.ViewingOverview)}
                >
                    {'Overview'}
                </TabItem>
            </Row>
            {tabPage}
        </Container>
    );
};

export default IncidentBackstage;