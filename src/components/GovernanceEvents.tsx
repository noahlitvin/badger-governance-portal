import { Typography, Box, makeStyles, Tooltip } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import React, { useState, useEffect } from 'react';
import Logo from '../assets/logo.png';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import GovernanceTimelockAbi from '../abi/GovernanceTimelock.json';

const GovernanceTimelockAddress = '0x21CF9b77F88Adf8F8C98d7E33Fe601DC57bC0893';

const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
const GovernanceContract = new web3.eth.Contract(GovernanceTimelockAbi as AbiItem[], GovernanceTimelockAddress);

const useStyles = makeStyles((theme) => ({
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    transform: 'translateY(12px)',
    marginRight: 8,
  },
  rootContainer: {
    height: '100%',
    width: '100%',
    maxWidth: 720,
    margin: 'auto',
    paddingBottom: theme.spacing(4),
  },
  links: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderBottom: '1px solid rgba(255,255,255,0.25)',
    transition: 'background 0.1s',
  },
  header: {
    paddingTop: theme.spacing(4),
    fontWeight: 300,
  },
  subheader: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(1),
    fontWeight: 600,
  },
  anchor: {
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    minWidth: '65px',
  },
  tooltipWrap: {
    cursor: 'help',
    borderBottom: '1px dotted',
    fontFamily: 'monospace',
  },
  icon: {
    opacity: 0.75,
    transform: 'scale(0.8)',
  },
  hover: {
    background: 'rgba(242, 165,43,0.08)',
  },
}));

const GovernanceEvents = observer(() => {
  const classes = useStyles();

  const [adminAddress, setAdminAddress] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');
  const [eventData, setEventData] = useState([]);
  const [hoverKey, setHoverKey] = useState('');

  useEffect(() => {
    // Retrieve admin address
    GovernanceContract.methods.admin().call(function (err: any, res: string) {
      if (err) {
        console.log('An error occured', err);
        return;
      }
      setAdminAddress(res);
    });

    // Retrieve guardian address
    GovernanceContract.methods.guardian().call(function (err: any, res: string) {
      if (err) {
        console.log('An error occured', err);
        return;
      }
      setGuardianAddress(res);
    });

    // Retrieve events
    GovernanceContract.getPastEvents('allEvents', {
      fromBlock: 0,
      toBlock: 'latest',
    }).then(function (events) {
      setEventData(events as any);
    });
  }, []);

  const processedEventData = eventData
    .sort((a: any, b: any) => (b.blockNumber + b.id > a.blockNumber + a.id ? 1 : -1))
    .map((eventData: any) => {
      const signature = eventData.returnValues.signature;
      const parameters = signature.substring(signature.indexOf('(') + 1, signature.lastIndexOf(')'));
      eventData.parsedData = {
        functionName: signature.split('(')[0],
        parameterTypes: parameters.split(','),
      };

      try {
        eventData.parsedData.decodedParameters = web3.eth.abi.decodeParameters(
          parameters.split(','),
          eventData.returnValues.data,
        );
      } catch {
        eventData.parsedData.decodedParameters = false;
      }

      return eventData;
    });

  const toggleHover = (key: string) => {
    setHoverKey(key);
  };

  return (
    <div className={classes.rootContainer}>
      <Typography variant="h4" className={classes.header}>
        <img src={Logo} className={classes.logo} /> Badger Governance Portal
      </Typography>

      <Typography variant="h6" className={classes.subheader}>
        Addresses
      </Typography>

      <div className={classes.links}>
        <Typography align="right">
          <strong>Contract</strong>
        </Typography>
        <a
          href={'https://etherscan.io/address/' + GovernanceTimelockAddress}
          target="_blank"
          rel="noreferrer"
          className={classes.anchor}
        >
          <Typography align="left">
            <code>{GovernanceTimelockAddress}</code>
          </Typography>
          <ExitToAppIcon className={classes.icon} />
        </a>
      </div>
      <div className={classes.links}>
        <Typography align="right">
          <strong>Admin</strong>
        </Typography>
        <a
          href={'https://etherscan.io/address/' + adminAddress}
          target="_blank"
          rel="noreferrer"
          className={classes.anchor}
        >
          <Typography align="left">
            <code>{adminAddress}</code>
          </Typography>
          <ExitToAppIcon className={classes.icon} />
        </a>
      </div>
      <div className={classes.links}>
        <Typography align="right">
          <strong>Guardian</strong>
        </Typography>
        <a
          href={'https://etherscan.io/address/' + guardianAddress}
          target="_blank"
          rel="noreferrer"
          className={classes.anchor}
        >
          <Typography align="left">
            <code>{guardianAddress}</code>
          </Typography>
          <ExitToAppIcon className={classes.icon} />
        </a>
      </div>

      <Typography variant="h6" className={classes.subheader}>
        Events
      </Typography>

      <div className={classes.links}>
        <Box sx={{ width: '20%' }}>
          <strong>Block Number</strong>
        </Box>
        <Box sx={{ width: '35%' }}>
          <strong>Event</strong>
        </Box>
        <Box sx={{ width: '40%' }}>
          <strong>Action</strong>
        </Box>
      </div>
      {processedEventData.map((eventData: any) => (
        <div
          key={eventData.id}
          className={`${classes.links} ${
            hoverKey == eventData.returnValues.signature + eventData.returnValues.data && classes.hover
          }`}
          onMouseEnter={() => toggleHover(eventData.returnValues.signature + eventData.returnValues.data)}
          onMouseLeave={() => toggleHover('')}
        >
          <Box sx={{ width: '20%' }}>{eventData.blockNumber}</Box>
          <Box sx={{ width: '35%' }}>{eventData.event}</Box>
          <Box sx={{ width: '40%' }}>
            {eventData.parsedData.functionName}
            <span>(</span>
            {eventData.parsedData.parameterTypes.length &&
              eventData.parsedData.parameterTypes.map((param: any, ind: any) => (
                <span key={eventData.id + '-' + ind}>
                  <Tooltip
                    className={classes.tooltipWrap}
                    title={
                      eventData.parsedData.decodedParameters
                        ? (Object.values(eventData.parsedData.decodedParameters)[ind] as string)
                        : 'Could not decode'
                    }
                  >
                    <span>{param}</span>
                  </Tooltip>
                  {eventData.parsedData.parameterTypes.length - 1 > ind && ', '}
                </span>
              ))}
            <span>)</span>
          </Box>
        </div>
      ))}
    </div>
  );
});

export default GovernanceEvents;
