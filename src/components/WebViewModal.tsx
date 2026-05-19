import React, { useRef, useState, useEffect } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonContent,
} from '@ionic/react';
import { arrowBackOutline, reloadOutline } from 'ionicons/icons';

interface Props {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const WebViewModal: React.FC<Props> = ({ url, title, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen, url]);

  const reload = () => {
    setLoading(true);
    if (iframeRef.current) iframeRef.current.src = url;
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={arrowBackOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={reload}>
              <IonIcon icon={reloadOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {loading && (
          <div className="wv-progress-bar">
            <div className="wv-progress-track" />
          </div>
        )}
      </IonHeader>
      <IonContent
        scrollY={false}
        style={{
          '--padding-top': '0',
          '--padding-bottom': '0',
          '--padding-start': '0',
          '--padding-end': '0',
          '--overflow': 'hidden',
        }}
      >
        <iframe
          ref={iframeRef}
          src={isOpen ? url : undefined}
          title={title}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            border: 'none', display: 'block',
          }}
          allow="payment *; camera *; microphone *; geolocation *"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      </IonContent>
    </IonModal>
  );
};

export default WebViewModal;
